---
paths:
  - "src/lib/shop.ts"
  - "src/lib/portone.ts"
  - "src/lib/products.ts"
  - "src/lib/supabase/admin.ts"
  - "src/lib/supabase/proxy.ts"
  - "src/app/api/payments/**"
  - "src/app/products/**"
  - "src/app/orders/**"
  - "src/app/mypage/**"
  - "src/components/product/**"
  - "src/components/screens/ProductDetailScreen.tsx"
  - "src/components/screens/OrderResultScreen.tsx"
  - "src/components/screens/MyPageScreen.tsx"
  - "src/stories/**/productFixtures.ts"
  - ".env.example"
---

# 결제 규칙 (SSOT)

결제 · 취소 · 환불 · 웹훅 등 돈이 오가는 기능은 이 문서를 따른다. 코드와 다르면 이 문서가 기준이고, 규칙을 바꿀 땐 **문서를 먼저** 고친다.

- PG: 포트원 V2 (`@portone/browser-sdk/v2` · `@portone/server-sdk`). API 필드명은 PortOne MCP로 확인하고 쓴다.
- 저장소: Supabase `payment`(원장) · `payment_snapshot`(스냅샷) · `product`(상품)

## 1. 구성

| 위치 | 역할 |
|---|---|
| `src/lib/portone.ts` | 포트원 SDK 래퍼 — 결제 조회 · 취소 · 웹훅 서명 검증. **포트원 비밀값은 여기서만 읽는다** |
| `src/lib/shop.ts` | 결제 준비 · 검증 · 기록 · 취소 · 주문 조립 (도메인 로직) |
| `src/lib/supabase/admin.ts` | service role 클라이언트 — 원장 기록(+ 웹훅 기록 여부 확인) 전용 |
| `api/payments/prepare` | 결제창 호출 정보 발급 |
| `api/payments/complete` | 브라우저 결제 완료 → 검증 · 기록 |
| `api/payments/[id]/cancel` | 고객 결제 취소 |
| `api/payments/webhook` | 포트원 웹훅 수신 |
| `products/[id]/complete` · `orders/[id]` | 결제창 `redirectUrl` · 결제 결과(원장 읽기만) |

- 클라이언트는 포트원 API · Supabase를 직접 호출하지 않는다(결제창 `requestPayment`만 예외). 서버 모듈은 `import "server-only"`.
- 로그는 `[payment]` 접두사 + `paymentId` + 오류 메시지만. 카드 · 구매자 정보 · 비밀값 · 포트원 응답 원문 금지.

## 2. 환경변수 (`.env.example`이 기준 · 모두 서버 전용 · `NEXT_PUBLIC_` 금지)

| 키 | 비밀 | 용도 |
|---|---|---|
| `PORTONE_STORE_ID` · `PORTONE_CHANNEL_KEY` | 아님 | 결제창 호출 — prepare 응답으로만 브라우저에 전달 |
| `PORTONE_API_SECRET` | **비밀** | 결제 조회 · 취소 |
| `PORTONE_WEBHOOK_SECRET` | **비밀** | 웹훅 서명 검증 |
| `SUPABASE_SECRET_KEY` | **비밀** | service role (`record_payment_*`) |

- 상점 ID · 채널 키 · 금액을 클라이언트 코드에 하드코딩하지 않는다. 테스트 → 실연동 전환은 환경변수 교체만으로 끝난다.

## 3. 결제 흐름 (카드 일반 결제)

```
결제하기 → POST /api/payments/prepare { productId }
  서버: 로그인 · 공개 상품 · 판매 기간 · 정원 · 중복 결제 확인(안내용)
  응답: storeId · channelKey · paymentId(uuid) · orderName · totalAmount · currency KRW
        · payMethod CARD · redirectUrl · customData { productId, userId }
→ PortOne.requestPayment({ ...응답, forceRedirect: true })
→ /products/[id]/complete?paymentId=…(&code=…)
    code 있음 → 실패 화면 (서버 호출 · 기록 없음)
    code 없음 → POST /api/payments/complete → /orders/[paymentId]
→ 동시에 포트원 웹훅 Transaction.Paid → POST /api/payments/webhook (도착 순서 보장 없음)
```

- `paymentId` · `orderName` · `totalAmount` · `customData`는 **서버가 정한다**. `customData.userId` = 세션 사용자.
- prepare는 원장에 쓰지 않는다. 결제창 이탈 · 실패는 기록하지 않는다(포트원이 원본).

## 4. 결제 검증 · 기록 — 브라우저 · 웹훅 공용 (`recordPaidPayment`)

진입 조건 (경로별):

| | 브라우저 `completePayment` | 웹훅 `syncPaidPayment` |
|---|---|---|
| 이미 기록됨 | 세션 RLS로 원장 조회 → 성공 | service role로 `PAID` 존재만 확인 → 성공 (**재검증 금지**) |
| 결제 조회 없음 | 404 | 무시 |
| 사용자 | `customData.userId` = 세션 사용자, 아니면 403 | `customData.userId`(uuid), 없으면 무시 |
| 상점 | `storeId` = `PORTONE_STORE_ID`, 아니면 403 | 같음, 아니면 무시 |

- 사용자 · 상점 불일치는 **환불하지 않는다**(남의 결제일 수 있다). 기록 여부를 먼저 보는 이유: 기록 후 가격 변경 · 행사 시작 시 재검증하면 정상 결제가 환불된다.

공용 검증 (순서대로, 결제 조회 API 응답 기준 — 브라우저 결과 · 웹훅 본문 미신뢰):

1. `status === "PAID"` 아니면 `PAYMENT_NOT_PAID` (환불 없음)
2. 아래는 **즉시 전액 자동 환불**(`requester: "ADMIN"`) 후 실패
   - 상품 없음 · 비공개 → `VERIFICATION_FAILED`
   - `currency !== "KRW"` 또는 `amount.total !== 현재 product.price` → `VERIFICATION_FAILED`
   - 행사 시작 시각 지남 → `ENDED`
   - `record_payment_paid` → `DUPLICATE` → `ALREADY_PAID` · `SOLD_OUT` → `SOLD_OUT`
3. `record_payment_paid` → `RECORDED` · `ALREADY_RECORDED` = 성공

- 자동 환불 실패 → `console.error("[payment] 자동 환불 실패 …")` (포트원 콘솔 수동 취소 대상).
- 원장 기록 DB 오류 → **환불하지 않는다**. 브라우저는 "다시 확인", 웹훅은 5xx로 재시도해 복구한다.
- 실패 화면("0원 · 청구되지 않음")은 위 실패 코드에서만. 그 외 오류는 "결제를 확인하지 못했어요 + 다시 확인".
- 웹훅이 먼저 기록 → 이후 브라우저 complete는 "이미 기록됨"으로 성공. 웹훅이 먼저 환불 → 브라우저는 `PAYMENT_NOT_PAID`.

## 5. 중복 결제 방지

- **1인 1상품 1자리.** 같은 사용자가 같은 상품에 취소되지 않은 `PAID`가 있으면 새 결제를 막는다(취소하면 재결제 가능).
- 최종 판단은 `record_payment_paid`: `product` 행 `for update` 잠금 → `ALREADY_RECORDED`(같은 paymentId) → `DUPLICATE`(같은 사용자 · 상품) → `SOLD_OUT`(정원) 순으로 판정 후 INSERT. 브라우저 · 웹훅이 동시에 와도 1건만 기록된다. `unique (transaction_key, type)`이 DB에서 한 번 더 막는다.

## 6. 원장 `payment` — append-only

| 컬럼 | 규칙 |
|---|---|
| `transaction_key` | 포트원 `paymentId`(uuid, 웹훅 `data.paymentId`와 같은 값). 결제 1건의 모든 행을 묶는 그룹 키 |
| `type` | `PAID` · `CANCEL_REQUESTED` · `CANCELLED` |
| `amount` | **결제 `+` · 취소 `−`** (`payment_amount_sign` 제약). 전액 취소만 지원하므로 취소 행 = `−PAID.amount` |
| `product_id` · `user_id` | 결제 시점 값. 취소 행도 PAID 행과 같다 |
| `payment_snapshot_id` | 행마다 새 스냅샷 1개 (unique) |

- **INSERT만.** UPDATE · DELETE · TRUNCATE는 트리거 `forbid_payment_mutation`이 service role 포함 모두 막는다. 상태 변경 = 새 행 추가.
- 상태 = 가장 진행된 이벤트: `CANCELLED`(환불 완료) > `CANCEL_REQUESTED`(환불 처리 중) > `PAID`.
- 순결제액 = `sum(amount) where type in ('PAID', 'CANCELLED')`. `CANCEL_REQUESTED`는 진행 표시이므로 합산하지 않는다.
- 부분 취소는 미지원. 도입 시 type · unique 키 · 부호 규칙을 이 문서에 먼저 정의한다.

## 7. 스냅샷 `payment_snapshot`

- 원장 행 1개 = 스냅샷 1개, `record_payment_*` 안에서 **같은 트랜잭션**으로 만든다. 스냅샷도 append-only.
- `snapshot_payment` = 그 시점 포트원 결제 조회 응답 전체 · `snapshot_product` = 그 시점 `product` 행(`PRODUCT_SELECT`). 취소 시 상품이 비공개면 PAID 스냅샷 상품을 쓴다.
- 주문 화면의 상품 정보 · 결제 수단 · `paidAt`은 **PAID 스냅샷**에서 읽는다.
- `snapshot_payment`에는 구매자 정보가 있다. 원문을 클라이언트로 보내지 말고 필요한 필드만 `Order`로 조립한다.

## 8. 권한 · RLS

| 대상 | anon | authenticated | service role |
|---|---|---|---|
| `product` | 공개 SELECT | 공개 SELECT | — |
| `payment` · `payment_snapshot` | 없음 | 본인 것 SELECT | `record_payment_*`로만 INSERT |
| `product_seat_counts` | 불가 | 실행 (security definer, advisor 경고 의도됨) | 실행 |
| `record_payment_paid` · `record_payment_cancel` | 불가 | 불가 | 실행 |

- 원장 조회는 세션 클라이언트(`server.ts`, RLS). 기록은 `createAdminClient().rpc("record_payment_*")`로만, 테이블 직접 insert 금지.
- 예외: 웹훅은 세션이 없으므로 **기록 여부 확인**(`transaction_key` · `type`)만 service role로 한다. 상품은 anon으로 읽는다.
- service role로 원장 외 데이터를 읽거나 쓰지 않는다.

## 9. 상품 · 판매 · 정원

- 판매 대상 = `product.status = 'Public'`. 비공개는 모든 경로에서 "없는 상품".
- 판매 상태: `event_at` 이후 `ended` → 정원 도달 `closed` → `on_sale`.
- 참여 인원 = 취소 행이 없는 `PAID` 건수(`product_seat_counts`).
- 가격 변경은 기존 결제에 영향 없음(스냅샷). 결제창이 열린 사이 바뀌면 금액 불일치로 자동 환불.

## 10. 고객 취소 (`cancelPayment`)

- 본인 결제 · 상태 `PAID` · **전액 환불만**. 기한: 행사 **3일 전 23:59:59 KST**(`REFUND_DAYS = 3`, PAID 스냅샷 `event_at` 기준). 이후 `NOT_CANCELABLE`.
- 포트원 취소: `amount` = `currentCancellableAmount` = PAID 금액(잔액 불일치 시 포트원이 거절 → 중복 · 경합 취소 방지), `requester: "CUSTOMER"`, `reason: "고객 요청 취소"`.
- 결과 → 원장 (`amount = −PAID 금액`):
  - `SUCCEEDED` → `CANCELLED` · `REQUESTED` → `CANCEL_REQUESTED`(완료는 웹훅이 반영)
  - `PAYMENT_ALREADY_CANCELLED` → `CANCELLED`로 동기화 · 그 외 실패 → 기록 없이 오류
- **포트원 취소가 먼저, 원장 기록이 나중.** 기록 실패 시 `console.error("[payment] 취소 원장 기록 실패 …")`, 재요청 시 `PAYMENT_ALREADY_CANCELLED` 경로로 복구.
- 운영자 취소는 `requester: "ADMIN"`. 원장에 있는 결제면 같은 방식으로 기록한다.

## 11. 웹훅 `POST /api/payments/webhook`

- 콘솔: 결제 연동 › 연동 관리 › 결제알림(Webhook) 관리 › 결제모듈 V2 · 버전 `2024-04-25` · `application/json`. 테스트 · 실연동 URL · 시크릿은 각각 설정한다.
- proxy 로그인 검사 제외(`src/lib/supabase/proxy.ts`의 `PUBLIC`).
- **원문 body(text)** + 헤더로 `verifyPortoneWebhook` (`Webhook.verify`) 서명 검증. JSON 파싱 후 검증 금지.
- 본문의 금액 · 상태를 믿지 않는다. `data.paymentId`로 결제 조회 API를 다시 호출해 판단한다.
- 판정 · 기록은 complete · cancel과 **같은 함수**를 쓴다. 웹훅 전용 판정 로직을 만들지 않는다.
- 같은 웹훅이 여러 번 와도 결과가 같다(`ALREADY_RECORDED` · unique 키). 포트원은 실패 시 최대 5회 재전송한다.

| 응답 | 경우 |
|---|---|
| 200 | 처리 성공 · 이미 처리됨 · 처리 대상 아님(모르는 type · 결제 없음 · 남의 상점 · 검증 실패 후 자동 환불) |
| 400 | 서명 검증 실패 |
| 5xx | 시크릿 미설정 · 포트원 조회 오류 · 원장 기록 DB 오류 → 포트원 재시도 |

| type | 처리 | 상태 |
|---|---|---|
| `Transaction.Paid` | `syncPaidPayment` → 4절 | 구현 |
| `Transaction.CancelPending` | `CANCEL_REQUESTED` 행 | 미구현(무시) |
| `Transaction.Cancelled` | `CANCELLED` 행 | 미구현(무시) |
| `Transaction.PartialCancelled` | 미지원 — `console.error` 후 200, 수동 처리 | 미구현(무시) |

### 11-1. 결제 취소 웹훅 (추후 구현 시 지킬 규칙)

- 원장에 `PAID`가 없으면 무시(200) — 검증 실패로 자동 환불된 미기록 결제다.
- 결제 조회 응답의 `status`로 판단한다: `CANCELLED` → `CANCELLED` 행, 취소 요청 진행 중 → `CANCEL_REQUESTED` 행. 응답과 웹훅 type이 다르면 조회 응답을 따른다.
- 이미 `CANCELLED`가 있으면 성공(200). `CANCEL_REQUESTED` 없이 `CANCELLED`만 기록해도 된다. 부분 취소(금액 ≠ PAID)는 기록하지 않고 `console.error`.
- 금액 = `−PAID.amount`, `user_id` = 원장 PAID 행 값. `record_payment_cancel`로 기록하고 스냅샷은 조회 응답 + 현재 상품(비공개면 PAID 스냅샷 상품).
- 고객 취소(10절)와 같은 기록 함수를 공유한다. 콘솔 운영자 취소도 이 경로로 원장에 반영된다.

## 12. 화면 · 응답

- 실패 응답: `OrderErrorBody { code?, message, product? }` (`src/lib/products.ts`). 새 실패 코드는 이 문서 4 · 10절에 적는다.
- 주문 id = `paymentId`. 주문번호 = `YYYYMMDD(KST 결제일)-paymentId 앞 8자리 대문자`(`orderNumber`). 금액 `formatPrice` · 결제 수단 `paymentMethodLabel`.
- `/orders/[id]` · `/products/[id]/complete` GET은 원장을 쓰지 않는다. 새로고침 · 뒤로 가기로 결제가 다시 일어나지 않는다.

## 13. 변경 체크리스트

- [ ] 금액 · 상품명 · 사용자 id를 서버가 정하고, 결제 조회 API로 검증하는가 (브라우저 결과 · 웹훅 본문 미신뢰)
- [ ] 원장 INSERT만, `record_payment_*`로만, 스냅샷 같은 트랜잭션, 부호(+결제 · −취소)를 지키는가
- [ ] 반복 요청 · 웹훅 재전송에도 결과가 같은가 (멱등) · 중복 결제 · 비공개 · 판매 종료 · 정원을 막는가
- [ ] 비밀값이 번들 · 응답 · 로그에 없는가 · 새 환경변수를 `.env.example`에 추가했는가
- [ ] DB 변경은 마이그레이션 + `get_advisors(security)` 확인 · 스토리 · 테스트 · 이 문서를 갱신했는가
