import { NextResponse, connection } from "next/server";
import { mapSdkSrc } from "@/lib/naver";

/** GET /api/places/map/sdk — 네이버 지도 JS SDK 스크립트 주소 (키를 클라이언트 번들·NEXT_PUBLIC_ 변수에 두지 않는다) */
export async function GET() {
  // 빌드 시점이 아닌 요청 시점의 환경변수를 읽는다
  await connection();
  try {
    return NextResponse.json({ src: mapSdkSrc() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "지도를 불러오지 못했어요." }, { status: 503 });
  }
}
