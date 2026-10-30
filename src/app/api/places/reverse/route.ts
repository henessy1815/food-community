import { NextResponse } from "next/server";
import type { PlaceErrorBody, ReverseGeocodeBody } from "@/lib/place";
import { reverseGeocode } from "@/lib/naver";
import { createClient } from "@/lib/supabase/server";

function fail(status: number, body: PlaceErrorBody) {
  return NextResponse.json(body, { status });
}

/** GET /api/places/reverse?lat=&lng= — 지도 핀 위치의 주소 (맛집 등록 화면 전용이라 로그인 필요) */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, { message: "로그인이 필요해요." });

  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (!params.get("lat") || !params.get("lng") || Math.abs(lat) > 90 || Math.abs(lng) > 180 || isNaN(lat + lng)) {
    return fail(400, { message: "좌표가 올바르지 않아요." });
  }

  try {
    const place = await reverseGeocode({ lat, lng });
    if (!place) return fail(404, { message: "이 위치의 주소를 찾을 수 없어요." });
    return NextResponse.json<ReverseGeocodeBody>(place);
  } catch (error) {
    console.error(error);
    return fail(502, { message: "주소를 불러오지 못했어요." });
  }
}
