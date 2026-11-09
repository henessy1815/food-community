import { NextResponse } from "next/server";
import { getProduct } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";

/** GET /api/products/[id] — 결제 바텀시트를 열 때 최신 참여 인원을 다시 불러온다 */
export async function GET(_request: Request, { params }: RouteContext<"/api/products/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const product = await getProduct(id, user?.id);
  if (!product) return NextResponse.json({ message: "상품을 찾을 수 없어요." }, { status: 404 });
  return NextResponse.json(product);
}
