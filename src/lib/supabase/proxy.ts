import "server-only";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/** 로그인 없이 접근 가능한 경로 — 나머지는 모두 로그인이 필요하다 */
const PUBLIC = [/^\/login$/, /^\/api\/auth(\/|$)/];

/** 요청마다 Supabase 세션 쿠키를 갱신하고, 로그인 여부로 리다이렉트한다 (src/proxy.ts에서 호출) */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // createServerClient와 getClaims 사이에 다른 로직을 넣지 말 것 — 세션 갱신이 깨질 수 있음
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  if (!isAuthenticated && !PUBLIC.some((re) => re.test(pathname))) {
    // BFF API는 리다이렉트 대신 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
    return redirectWithCookies(loginUrl, response);
  }

  if (isAuthenticated && pathname === "/login") {
    return redirectWithCookies(new URL("/", request.url), response);
  }

  return response;
}

/** 갱신된 세션 쿠키를 유지한 채 리다이렉트 */
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
