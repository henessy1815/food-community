import { NextResponse } from "next/server";
import type { OrderErrorBody, PaymentRequestParams } from "@/lib/products";
import { preparePayment } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/payments/prepare — JSON: { productId }
 * 판매 가능 여부를 확인하고 PortOne.requestPayment()에 넘길 값을 내려준다 (금액·상품명·paymentId는 서버가 정한다).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json<OrderErrorBody>({ message: "로그인이 필요해요." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { productId?: unknown } | null;
  if (typeof body?.productId !== "string") {
    return NextResponse.json<OrderErrorBody>({ message: "상품 정보가 올바르지 않아요." }, { status: 400 });
  }

  try {
    const result = await preparePayment(user.id, body.productId, new URL(request.url).origin);
    if (!result.ok) return NextResponse.json<OrderErrorBody>(result.error, { status: result.status });
    return NextResponse.json<PaymentRequestParams>(result.value);
  } catch (error) {
    console.error("[payment] prepare", error);
    return NextResponse.json<OrderErrorBody>(
      { message: "결제를 시작하지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 503 },
    );
  }
}
