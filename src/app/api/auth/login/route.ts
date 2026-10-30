import { NextResponse, type NextRequest } from "next/server";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const PROVIDERS: Provider[] = ["google"];

/** GET /api/auth/login?provider=google&next=/ — 소셜 로그인 시작 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const provider = searchParams.get("provider") as Provider | null;
  const next = safeNext(searchParams.get("next"));

  if (!provider || !PROVIDERS.includes(provider)) {
    return NextResponse.redirect(`${origin}/login?error=invalid_provider`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  return NextResponse.redirect(data.url);
}

/** 오픈 리다이렉트 방지 — 같은 사이트 내부 경로만 허용 */
function safeNext(next: string | null) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/";
}
