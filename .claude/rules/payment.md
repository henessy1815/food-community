---
paths:
  - "src/lib/shop.ts"
  - "src/lib/portone.ts"
  - "src/lib/products.ts"
  - "src/lib/supabase/admin.ts"
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

결제·취소·환불·웹훅·정산 등 **돈이 오가는 모든 기능**은 이 문서를 따른다.
이 문서와 코드가 다르면 이 문서가 기준이다. 규칙을 바꿔야 하면 **이 문서를 먼저 고치고** 코드를 맞춘다.

- PG: 포트원 V2 (`@portone/browser-sdk/v2` · `@portone/server-sdk`)
- 문서·API 스키마 확인은 PortOne MCP(`portone-mcp-server`)로 한다. 기억에 의존해 API 필드명을 쓰지 않는다.
- 저장소: Supabase `payment`(원장) · `payment_snapshot`(스냅샷) · `product`(상품)

---

## 1. 구성

| 위치 | 역할 |
|---|---|
| `src/lib/portone.ts` | 포트원 서버 SDK 래퍼 — 결제 조회 · 취소 · 결제수단 표기. API Secret은 여기서만 읽는다 |
| `src/lib/shop.ts` | 상품 조회 · 결제 준비 · 결제 완료 검증 · 취소 · 주문 조립 (BFF 도메인 로직) |
| `src/lib/supabase/admin.ts` | service role 클라이언트 — **원장 기록 함수 호출 전용** |
| `src/app/api/payments/prepare` | 결제창 호출 정보 발급 |
| `src/app/api/payments/complete` | 결제 검증 + 원장 기록 |
| `src/app/api/payments/[id]/cancel` | 고객 결제 취소 |
| `src/app/products/[id]/complete` | 결제창 `redirectUrl` (결제 완료 페이지) |
| `src/app/orders/[id]` | 결제 결과 (id = 포트원 paymentId) |

- 클라이언트 컴포넌트는 포트원 API·Supabase를 직접 호출하지 않는다. 결제창 SDK(`requestPayment`)만 예외다.
- 결제 관련 서버 모듈은 `import "server-only"`로 시작한다.

## 2. 환경변수

`.env.example`이 목록의 기준이다. 모두 **서버 전용**이며 `NEXT_PUBLIC_` 접두사를 쓰지 않는다.

| 키 | 비밀 | 용도 |
|---|---|---|
| `PORTONE_STORE_ID` | 아님 | 상점 ID — prepare 응답으로만 브라우저에 전달 |
| `PORTONE_CHANNEL_KEY` | 아님 | 채널 키 — prepare 응답으로만 브라우저에 전달 |
| `PORTONE_API_SECRET` | **비밀** | V2 API Secret — 결제 조회 · 취소. 응답·로그·클라이언트에 절대 노출 금지 |
| `PORTONE_WEBHOOK_SECRET` | **비밀** | 웹훅 서명 검증 (웹훅 연동 시) |
| `SUPABASE_SECRET_KEY` | **비밀** | service role — `record_payment_*` 호출 전용 |

- 상점 ID · 채널 키 · 금액을 클라이언트 코드에 하드코딩하지 않는다.
- 테스트 채널 → 실연동 채널 전환은 환경변수 교체만으로 끝나야 한다.

## 3. 결제 흐름 (일반 결제 · 카드)

```
[상세] 결제하기 → 결제 시트(환불 규정 동의)
  → POST /api/payments/prepare { productId }
      서버: 로그인 · 공개 상품 · 판매 기간 · 정원 · 중복 결제 확인
      응답: storeId · channelKey · paymentId(uuid) · orderName(상품명) · totalAmount(상품가)
            · currency KRW · payMethod CARD · redirectUrl · customData { productId, userId }
  → PortOne.requestPayment({ ...응답, forceRedirect: true })
  → 포트원이 redirectUrl로 이동: /products/[id]/complete?paymentId=…(&code=…&message=…)
      code 있음 → 결제 실패 화면 (서버 호출 없음, 원장 기록 없음)
      code 없음 → POST /api/payments/complete { paymentId } → 성공 시 /orders/[paymentId]
```

- **결제 정보는 서버가 정한다.** `paymentId`(uuid v4) · `orderName` · `totalAmount` · `customData`는 prepare에서 만들고, 클라이언트가 보낸 금액·상품명은 어디에도 쓰지 않는다.
- `customData.userId`는 세션 사용자 id다. 클라이언트 입력으로 받지 않는다.
- `forceRedirect: true`를 유지한다. PC · 모바일 결과 처리를 `redirectUrl` 하나로 통일한다.
- `redirectUrl`은 요청 origin 기준 절대 주소 `/products/{productId}/complete`다.
- prepare는 원장에 아무것도 쓰지 않는다. 결제창을 열었다가 닫은 시도는 기록하지 않는다(포트원 콘솔에 남는다).

## 4. 결제 검증 (`completePayment`) — 하나라도 실패하면 기록하지 않는다

순서대로 확인한다.

1. `paymentId`가 uuid 형식이다.
2. 원장에 같은 `transaction_key`가 이미 있으면 **성공으로 응답한다** (멱등 · 새로고침).
3. 포트원 **결제 조회 API**(`getPayment`)로 실제 결제를 가져온다. 브라우저가 준 결과(`code` 없음)만 믿지 않는다.
4. `customData.userId` = 세션 사용자이고, `storeId` = `PORTONE_STORE_ID`이다. 아니면 403. **환불하지 않는다** (남의 결제일 수 있다).
5. `status === "PAID"`. 아니면 실패 응답 (`PAYMENT_NOT_PAID`). 환불하지 않는다.
6. 아래 실패는 **즉시 전액 자동 환불**(`requester: "ADMIN"`)하고 실패를 응답한다.
   - 상품이 없거나 비공개(`status <> 'Public'`) → `VERIFICATION_FAILED`
   - `currency !== "KRW"` 또는 `amount.total !== 현재 product.price` → `VERIFICATION_FAILED` (위변조 의심)
   - 행사 시작 시각이 지남 → `ENDED`
   - `record_payment_paid` 결과 `SOLD_OUT`(정원 초과) → `SOLD_OUT` · `DUPLICATE`(같은 상품 결제 완료 건 있음) → `ALREADY_PAID`
7. `record_payment_paid` 결과 `RECORDED` · `ALREADY_RECORDED`면 성공이다.

- 자동 환불이 실패하면 `console.error("[payment] 자동 환불 실패 …")`로 남긴다. 포트원 콘솔에서 수동 취소하는 대상이다.
- **원장 기록 자체가 실패**(DB 오류)하면 환불하지 않는다. 결제는 유효하므로 같은 paymentId로 complete를 다시 호출해 복구한다(사용자에게 "다시 확인"을 안내한다). 웹훅 연동 후에는 웹훅이 복구한다.
- 실패 화면(“0원 · 청구되지 않음”)은 결제되지 않았거나 자동 환불된 코드(`PAYMENT_NOT_PAID` · `VERIFICATION_FAILED` · `SOLD_OUT` · `ENDED` · `ALREADY_PAID`)에서만 보여준다. 그 외 오류는 "결제를 확인하지 못했어요 + 다시 확인"을 보여준다.

## 5. 원장 `payment` — append-only

| 컬럼 | 규칙 |
|---|---|
| `transaction_key` | 포트원 `paymentId`(uuid). 결제 1건의 모든 이벤트 행을 묶는다 |
| `type` | `PAID` · `CANCEL_REQUESTED` · `CANCELLED` (check 제약) |
| `amount` | 그 이벤트의 금액(원). **항상 양수** (check 제약). 부호로 방향을 표현하지 않는다 |
| `product_id` · `user_id` | 결제 시점 값. 취소 행도 PAID 행과 같은 값 |
| `payment_snapshot_id` | 행마다 새 스냅샷 1개 (unique) |

- **INSERT만 허용한다.** UPDATE · DELETE · TRUNCATE는 트리거(`forbid_payment_mutation`)가 service role 포함 모두 막는다. 상태를 바꾸려면 새 행을 추가한다.
- `unique (transaction_key, type)` — 같은 결제에 같은 이벤트는 한 번만 기록된다. 이게 멱등성의 근거다.
- 결제 1건의 상태 = 가장 진행된 이벤트: `CANCELLED`(환불 완료) > `CANCEL_REQUESTED`(환불 처리 중) > `PAID`(결제 완료).
- 순결제액 = `PAID.amount − CANCELLED.amount`. 매출·정산 집계는 이 식으로만 한다.
- 결제 실패 · 결제창 이탈 · 검증 실패 후 자동 환불된 건은 원장에 없다 (포트원이 원본).
- 현재는 **전액 취소만** 지원한다. 부분 취소를 도입하려면 이 문서에 type · unique 키 규칙을 먼저 정의한다.

## 6. 스냅샷 `payment_snapshot` — 반드시 함께 기록

- 원장 행 1개 = 스냅샷 1개. 원장 행과 **같은 트랜잭션**(`record_payment_*` 함수 안)에서 만든다. 스냅샷 없는 원장 행은 없다.
- `snapshot_payment`: 그 이벤트 시점의 포트원 결제 조회 응답 전체(취소 행은 취소 후 다시 조회한 응답).
- `snapshot_product`: 그 이벤트 시점의 `product` 행 전체(`PRODUCT_SELECT` 모양). 취소 시 상품이 비공개면 PAID 스냅샷의 상품으로 대신한다.
- 스냅샷도 append-only다(같은 트리거).
- **주문 화면(결제 내역 · 결과 · 취소 내역)의 상품명 · 가격 · 일시 · 장소 · 이미지는 PAID 스냅샷의 상품을 쓴다.** 상품이 나중에 바뀌거나 비공개가 되어도 구매 당시 내용이 보인다.
- 결제 수단 표기·결제 시각(`paidAt`)도 PAID 스냅샷의 포트원 응답에서 읽는다.
- `snapshot_payment`에는 구매자 정보가 들어 있다. 원문을 클라이언트로 보내지 않는다. 화면에 필요한 필드만 골라 `Order`로 조립한다.

## 7. 권한 · RLS

| 대상 | anon | authenticated | service role (BFF) |
|---|---|---|---|
| `product` | 공개 상품 SELECT | 공개 상품 SELECT | — |
| `payment` | 없음 | **본인 행 SELECT만** | `record_payment_*`로만 INSERT |
| `payment_snapshot` | 없음 | 본인 결제의 스냅샷 SELECT만 | `record_payment_*`로만 INSERT |
| `product_seat_counts(uuid[])` | 불가 | 실행 (security definer, 숫자만 반환 — advisor 경고는 의도된 것) | 실행 |
| `record_payment_paid` · `record_payment_cancel` | 불가 | 불가 | 실행 |

- 원장 **조회**는 사용자 세션 클라이언트(`src/lib/supabase/server.ts`)로 해서 RLS를 거친다.
- 원장 **기록**은 `createAdminClient().rpc("record_payment_paid" | "record_payment_cancel")`로만 한다. 테이블에 직접 `insert`하지 않는다.
- service role 클라이언트로 원장 외 데이터를 읽거나 쓰지 않는다.

## 8. 상품 공개 · 판매 · 정원

- 판매 대상 = `product.status = 'Public'`. 비공개 상품은 목록 · 상세 · 결제 준비 · 결제 검증에서 모두 "없는 상품"이다.
- 판매 상태: 행사 시작(`event_at`) 이후 `ended` → 정원 도달 `closed` → 그 외 `on_sale`.
- 참여 인원 = 취소(`CANCEL_REQUESTED` · `CANCELLED`)되지 않은 `PAID` 건수 (`product_seat_counts`).
- 1인 1자리 · 같은 상품 중복 결제 금지(취소하면 다시 결제 가능).
- 정원 · 중복 판단의 최종 기준은 `record_payment_paid`다. 함수가 `product` 행을 `for update`로 잠그고 확인 · 기록하므로 동시 결제에도 초과 판매되지 않는다. prepare의 확인은 안내용이다.
- 상품 가격 변경은 이미 결제된 건에 영향을 주지 않는다(스냅샷). 결제창이 열린 사이 가격이 바뀌면 검증에서 금액 불일치로 자동 환불된다.

## 9. 결제 취소 · 환불

- 고객 취소 = **전액 환불만**. 본인 결제이고 상태가 `PAID`일 때만 가능하다.
- 환불 가능 기간: 행사 시작 **3일 전 23:59:59(KST)까지** (`REFUND_DAYS = 3`). 기준은 PAID 스냅샷 상품의 `event_at`이다. 이후는 취소 불가(`NOT_CANCELABLE`).
- 포트원 취소 요청: `amount` = 원장 PAID 금액, `currentCancellableAmount` = 같은 값(잔액이 다르면 포트원이 거절 → 중복 · 경합 취소 방지), `requester: "CUSTOMER"`, `reason: "고객 요청 취소"`.
- 포트원 취소 결과 → 원장 기록:
  - `SUCCEEDED` → `CANCELLED` 행 (환불 완료)
  - `REQUESTED` → `CANCEL_REQUESTED` 행 (환불 처리 중). 완료는 웹훅이 `CANCELLED` 행을 추가해 반영한다
  - `PAYMENT_ALREADY_CANCELLED` 오류 → 이미 취소된 것이므로 `CANCELLED` 행을 기록해 동기화
  - 그 외 실패 → 원장 기록 없이 오류 응답
- **포트원 취소가 먼저, 원장 기록이 나중이다.** 원장 기록이 실패하면 `console.error("[payment] 취소 원장 기록 실패 …")`를 남기고, 다시 취소 요청 시 `PAYMENT_ALREADY_CANCELLED` 경로로 복구된다.
- 운영자 취소(관리자 · 자동 환불)는 `requester: "ADMIN"`을 쓴다. 원장에 있는 결제를 운영자가 취소하면 고객 취소와 같은 방식으로 원장에 기록한다.

## 10. 웹훅 (미구현 — 도입 시 지킬 규칙)

- 엔드포인트: `POST /api/payments/webhook`. proxy의 로그인 검사 대상에서 제외한다(`src/lib/supabase/proxy.ts`의 `PUBLIC`).
- **원문 body(text)**로 `Webhook.verify(PORTONE_WEBHOOK_SECRET, body, headers)` 서명 검증. 실패 시 400. JSON 파싱 후 검증하지 않는다.
- 웹훅 본문의 금액 · 상태를 믿지 않는다. `data.paymentId`로 **결제 조회 API를 다시 호출**해 그 결과로 처리한다.
- 처리 로직은 complete · cancel과 **같은 함수**를 공유한다(검증 규칙 4절, 기록 함수 `record_payment_*`). 웹훅용 별도 판정 로직을 만들지 않는다.
- 같은 웹훅이 여러 번 와도 결과가 같아야 한다(`unique (transaction_key, type)` · `ALREADY_RECORDED`).
- 브라우저 complete 호출 없이 웹훅만 와도 결제가 기록되어야 한다(이탈 · 네트워크 끊김 대비). 이때 사용자 id는 `customData.userId`를 쓴다.
- 처리 성공 · 이미 처리됨 → 200. 일시적 오류 → 5xx(포트원 재시도).
- `CANCEL_REQUESTED` 이후 취소 완료 웹훅이 오면 `CANCELLED` 행을 추가한다.

## 11. 화면 · 응답

- 실패 응답 모양: `OrderErrorBody { code?, message, product? }` (`src/lib/products.ts`). 새 실패 사유는 `code`에 추가하고 이 문서 4 · 9절에 적는다.
- 주문 id = 포트원 `paymentId`. 주문번호 표기 = `YYYYMMDD(KST 결제일)-paymentId 앞 8자리 대문자`(`orderNumber`).
- 결제 결과 페이지(`/orders/[id]`)는 원장을 **읽기만** 한다. 새로고침 · 뒤로 가기로 결제가 다시 일어나지 않는다.
- 결제 완료 페이지(`/products/[id]/complete`)는 GET에서 원장을 쓰지 않는다. 기록은 클라이언트가 POST `/api/payments/complete`를 호출할 때만 한다.
- 금액 표기는 `formatPrice`, 결제수단 표기는 `paymentMethodLabel`(카드명 · 일시불/n개월 할부, 간편결제명)을 쓴다.

## 12. 로그 · 개인정보

- 로그에는 `paymentId`와 오류 메시지만 남긴다. 카드 정보 · 구매자 정보 · API Secret · 포트원 응답 원문을 로그에 남기지 않는다.
- 결제 관련 서버 로그는 `[payment]` 접두사로 시작한다.

## 13. 변경 체크리스트

결제 관련 코드를 바꿀 때 모두 확인한다.

- [ ] 금액 · 상품명 · 사용자 id를 서버에서 정하는가 (클라이언트 값 미사용)
- [ ] 포트원 결제 조회 API로 검증하는가 (브라우저 결과 · 웹훅 본문 미신뢰)
- [ ] 원장에 INSERT만 하고, `record_payment_*` 함수로만 기록하는가
- [ ] 원장 행마다 스냅샷이 같은 트랜잭션으로 생기는가
- [ ] 같은 요청이 반복돼도 결과가 같은가 (멱등)
- [ ] 비공개 상품 · 판매 종료 · 정원 · 중복 결제를 막는가
- [ ] 비밀값이 클라이언트 번들 · 응답 · 로그에 없는가 (`NEXT_PUBLIC_` 금지)
- [ ] 새 환경변수를 `.env.example`에 추가했는가
- [ ] DB 변경은 Supabase 마이그레이션으로 하고, 적용 후 `get_advisors(security)`를 확인했는가
- [ ] 스토리(`productFixtures.ts` 등)와 테스트를 갱신했는가
- [ ] 이 문서가 바뀐 동작을 설명하는가
