import { verifyPortoneWebhook } from "@/lib/portone";
import { syncPaidPayment } from "@/lib/shop";

/**
 * POST /api/payments/webhook — 포트원 V2 웹훅 (2024-04-25 · application/json). 규칙: .claude/rules/payment.md 10절
 * - 로그인 없이 호출된다 (proxy PUBLIC). 원문 body로 서명을 검증하고, 본문 값은 믿지 않고 결제 조회 API로 다시 확인한다.
 * - 200: 처리됨 · 이미 처리됨 · 무시(처리 대상 아님 · 검증 실패로 자동 환불). 400: 서명 검증 실패. 5xx: 일시적 오류 → 포트원 재시도
 */
export async function POST(request: Request) {
  const body = await request.text();

  let webhook;
  try {
    webhook = await verifyPortoneWebhook(body, request.headers);
  } catch (error) {
    // 시크릿 미설정 등 설정 오류
    console.error("[payment] webhook 설정 오류", error instanceof Error ? error.message : error);
    return new Response(null, { status: 500 });
  }
  if (!webhook) {
    console.error("[payment] webhook 서명 검증 실패");
    return new Response(null, { status: 400 });
  }

  // 결제 취소(Transaction.Cancelled · CancelPending)는 아직 처리하지 않는다 — 알지 못하는 type과 함께 무시
  if (webhook.type !== "Transaction.Paid" || !("data" in webhook)) return new Response(null, { status: 200 });

  const { paymentId } = webhook.data;
  try {
    const result = await syncPaidPayment(paymentId);
    if (result.ok) return new Response(null, { status: 200 });
    if (result.status >= 500) return new Response(null, { status: 503 });
    // 처리 대상이 아니거나 검증 실패(자동 환불 완료) — 재시도해도 결과가 같으므로 200
    console.info(`[payment] webhook 무시 paymentId=${paymentId} code=${result.error.code ?? result.status}`);
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(`[payment] webhook 처리 실패 paymentId=${paymentId}`, error instanceof Error ? error.message : error);
    return new Response(null, { status: 503 });
  }
}
