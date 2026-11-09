import { NextResponse } from "next/server";
import type { OrderErrorBody } from "@/lib/products";
import { cancelPayment } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";

/** POST /api/payments/[id]/cancel — id: 포트원 paymentId. 본인 결제만, 환불 가능 기간 안에서 전액 환불 */
export async function POST(_request: Request, { params }: RouteContext<"/api/payments/[id]/cancel">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json<OrderErrorBody>({ message: "로그인이 필요해요." }, { status: 401 });

  try {
    const result = await cancelPayment(user.id, id);
    if (!result.ok) return NextResponse.json<OrderErrorBody>(result.error, { status: result.status });
    return NextResponse.json(result.value);
  } catch (error) {
    console.error(`[payment] cancel paymentId=${id}`, error);
    return NextResponse.json<OrderErrorBody>({ message: "결제를 취소하지 못했어요." }, { status: 503 });
  }
}
