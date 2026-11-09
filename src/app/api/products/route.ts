import { NextResponse } from "next/server";
import { listProducts } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";

/** GET /api/products — 공개 상품 목록 (행사 일시순) */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    return NextResponse.json(await listProducts(user?.id));
  } catch {
    return NextResponse.json({ message: "상품 목록을 불러오지 못했어요." }, { status: 500 });
  }
}
