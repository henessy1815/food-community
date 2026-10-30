import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // 정적 파일 · 이미지 최적화 · 파비콘 · PWA manifest · 이미지 확장자 제외
    // (manifest는 쿠키 없이 요청되므로 로그인 리다이렉트를 타면 설치가 불가능해진다)
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
