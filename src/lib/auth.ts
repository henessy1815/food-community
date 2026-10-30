import "server-only";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
}

export const DEFAULT_AVATAR = "/images/avatar.jpg";

/** 로그인 사용자 + profile — 비로그인 시 null. Suspense 경계 안에서 호출할 것 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // supabase auth(getUser)가 Date.now()를 쓰므로 실제 요청 시점에만 실행
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profile")
    .select("nickname, image_path")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    nickname: profile?.nickname ?? user.email?.split("@")[0] ?? "",
    avatar: profile?.image_path ?? DEFAULT_AVATAR,
  };
}
