import { NextResponse } from "next/server";
import type { OrderErrorBody, PaymentCompletedBody } from "@/lib/products";
import { completePayment } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/payments/complete — JSON: { paymentId }
 * 포트원 결제 조회 API로 검증하고 원장에 기록한다. 같은 paymentId로 여러 번 호출해도 결과가 같다(멱등).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json<OrderErrorBody>({ message: "로그인이 필요해요." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { paymentId?: unknown } | null;
  if (typeof body?.paymentId !== "string") {
    return NextResponse.json<OrderErrorBody>({ message: "결제 정보가 올바르지 않아요." }, { status: 400 });
  }

  try {
    const result = await completePayment(user.id, body.paymentId);
    if (!result.ok) return NextResponse.json<OrderErrorBody>(result.error, { status: result.status });
    return NextResponse.json<PaymentCompletedBody>(result.value);
  } catch (error) {
    console.error(`[payment] complete paymentId=${body.paymentId}`, error);
    return NextResponse.json<OrderErrorBody>(
      { message: "결제 확인이 늦어지고 있어요. 잠시 후 다시 시도해주세요." },
      { status: 503 },
    );
  }
}
