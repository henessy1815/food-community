import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * BFF 전용 Supabase 클라이언트
 * Route Handler · Server Action · Server Component에서만 사용한다.
 * 요청마다 새로 생성할 것 (전역 공유 금지).
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component에서는 쿠키를 쓸 수 없다 — 세션 갱신은 proxy가 담당
        }
      },
    },
  });
}
