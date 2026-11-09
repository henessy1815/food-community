import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getSupabaseSecretKey } from "./env";

/**
 * service role Supabase 클라이언트 — RLS를 우회하므로 결제 원장 기록(record_payment_paid · record_payment_cancel)에만 쓴다.
 * 조회는 사용자 세션 클라이언트(server.ts)로 RLS를 거친다. 규칙: .claude/rules/payment.md
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  return createClient(url, getSupabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
