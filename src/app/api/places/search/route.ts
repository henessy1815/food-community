import { NextResponse } from "next/server";
import type { PlaceErrorBody, PlaceSearchBody } from "@/lib/place";
import { searchLocal } from "@/lib/naver";
import { createClient } from "@/lib/supabase/server";

function fail(status: number, body: PlaceErrorBody) {
  return NextResponse.json(body, { status });
}

/** GET /api/places/search?query= — 네이버 지역 검색 (맛집 등록 화면 전용이라 로그인 필요) */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, { message: "로그인이 필요해요." });

  const query = new URL(request.url).searchParams.get("query")?.trim() ?? "";
  if (!query) return NextResponse.json<PlaceSearchBody>({ items: [] });
  if (query.length > 50) return fail(400, { message: "검색어는 50자 이하로 입력해주세요." });

  try {
    return NextResponse.json<PlaceSearchBody>({ items: await searchLocal(query) });
  } catch (error) {
    console.error(error);
    return fail(502, { message: "장소를 검색하지 못했어요. 잠시 후 다시 시도해주세요." });
  }
}
