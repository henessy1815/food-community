import "server-only";
import { PortOneClient, RestError, type Payment } from "@portone/server-sdk";

/*
 * 포트원 V2 서버 연동 (BFF 전용) — 규칙 SSOT: .claude/rules/payment.md
 * - API Secret은 서버에서만 쓴다. 상점 ID · 채널 키는 결제창 호출에 필요해 /api/payments/prepare 응답으로만 내려준다.
 */

export type PortonePayment = Payment.Payment;

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} 환경변수가 필요합니다 (.env.local)`);
  return value;
}

/** 결제창 호출 정보 */
export function getPortoneConfig() {
  return { storeId: env("PORTONE_STORE_ID"), channelKey: env("PORTONE_CHANNEL_KEY") };
}

function client() {
  return PortOneClient({ secret: env("PORTONE_API_SECRET") });
}

/** 결제 단건 조회 — 없으면 null */
export async function getPortonePayment(paymentId: string): Promise<PortonePayment | null> {
  try {
    return await client().payment.getPayment({ paymentId, storeId: getPortoneConfig().storeId });
  } catch (error) {
    if (error instanceof RestError && error.data.type === "PAYMENT_NOT_FOUND") return null;
    throw error;
  }
}

export type CancelOutcome =
  | { ok: true; status: "SUCCEEDED" | "REQUESTED" }
  | { ok: false; alreadyCancelled: boolean; message: string };

/**
 * 전액 취소 — currentCancellableAmount로 취소 가능 잔액이 예상과 같을 때만 취소한다 (중복 · 경합 취소 방지)
 */
export async function cancelPortonePayment(
  paymentId: string,
  { amount, reason, requester }: { amount: number; reason: string; requester: "CUSTOMER" | "ADMIN" },
): Promise<CancelOutcome> {
  try {
    const { cancellation } = await client().payment.cancelPayment({
      paymentId,
      storeId: getPortoneConfig().storeId,
      amount,
      currentCancellableAmount: amount,
      reason,
      requester,
    });
    if (cancellation.status === "SUCCEEDED" || cancellation.status === "REQUESTED") {
      return { ok: true, status: cancellation.status };
    }
    return { ok: false, alreadyCancelled: false, message: "결제를 취소하지 못했어요." };
  } catch (error) {
    if (error instanceof RestError) {
      return {
        ok: false,
        alreadyCancelled: error.data.type === "PAYMENT_ALREADY_CANCELLED",
        message: "message" in error.data && error.data.message ? error.data.message : "결제를 취소하지 못했어요.",
      };
    }
    throw error;
  }
}

/** 결제 수단 한 줄 표기 — 신한카드 · 일시불 / 카카오페이 */
export function paymentMethodLabel(payment: PortonePayment): string {
  const method = "method" in payment ? payment.method : undefined;
  if (!method) return "카드";
  if (method.type === "PaymentMethodCard" && "card" in method) {
    const name = method.card?.name ?? "카드";
    const month = method.installment?.month ?? 0;
    return `${name} · ${month > 1 ? `${month}개월 할부` : "일시불"}`;
  }
  if (method.type === "PaymentMethodEasyPay" && "provider" in method && method.provider) {
    return EASY_PAY[method.provider] ?? method.provider;
  }
  return "카드";
}

const EASY_PAY: Record<string, string> = {
  KAKAOPAY: "카카오페이",
  NAVERPAY: "네이버페이",
  TOSSPAY: "토스페이",
  PAYCO: "페이코",
  SAMSUNGPAY: "삼성페이",
  APPLEPAY: "애플페이",
};
