import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { avatarError, nicknameError, type ProfileErrorBody } from "@/lib/profile";

const BUCKET = "profile-image";
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function fail(status: number, body: ProfileErrorBody) {
  return NextResponse.json(body, { status });
}

/** PATCH /api/profile — multipart: nickname(필수) · avatar(선택) */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, { message: "로그인이 필요해요." });

  const form = await request.formData();
  const nickname = String(form.get("nickname") ?? "").trim();
  const avatar = form.get("avatar");

  const nickError = nicknameError(nickname);
  if (nickError) return fail(400, { field: "nickname", message: nickError });

  const file = avatar instanceof File && avatar.size > 0 ? avatar : null;
  if (file) {
    const fileError = avatarError(file);
    if (fileError) return fail(400, { field: "avatar", message: fileError });
  }

  const { data: duplicate } = await supabase
    .from("profile")
    .select("user_id")
    .eq("nickname", nickname)
    .neq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (duplicate) return fail(409, { field: "nickname", message: "이미 사용 중인 닉네임이에요." });

  const { data: current } = await supabase
    .from("profile")
    .select("image_path")
    .eq("user_id", user.id)
    .maybeSingle();

  const update: { nickname: string; image_path?: string } = { nickname };
  let uploadedPath: string | null = null;

  if (file) {
    uploadedPath = `${user.id}/${Date.now()}.${EXT[file.type]}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(uploadedPath, file, { contentType: file.type });
    if (error) return fail(500, { field: "avatar", message: "사진을 올리지 못했어요." });

    update.image_path = supabase.storage.from(BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
  }

  const { data: profile, error } = await supabase
    .from("profile")
    .update(update)
    .eq("user_id", user.id)
    .select("nickname, image_path")
    .single();

  if (error) {
    if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath]);
    return fail(500, { message: "프로필을 저장하지 못했어요." });
  }

  // 이전에 올린 사진 정리 (Google 기본 사진 등 버킷 밖 URL은 건드리지 않음)
  const oldPath = storagePath(current?.image_path);
  if (uploadedPath && oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);

  return NextResponse.json({ nickname: profile.nickname, avatar: profile.image_path });
}

function storagePath(url: string | null | undefined) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url?.indexOf(marker) ?? -1;
  return url && i >= 0 ? url.slice(i + marker.length) : null;
}
