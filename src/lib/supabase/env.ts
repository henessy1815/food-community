import "server-only";

/** Supabase 접속 정보 — 서버 환경변수에서만 읽는다 (NEXT_PUBLIC_ 금지) */
export function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL · SUPABASE_PUBLISHABLE_KEY 환경변수가 필요합니다 (.env.local)");
  }

  return { url, key };
}

/** Storage 공개 주소 (…/storage/v1/object/public) — DB에는 파일 경로만 저장하고 URL은 이 값으로 조합한다 */
export function getStorageUrl() {
  const url = process.env.SUPABASE_STORAGE_URL;
  if (!url) {
    throw new Error("SUPABASE_STORAGE_URL 환경변수가 필요합니다 (.env.local)");
  }
  return url.replace(/\/$/, "");
}
