/* 프로필 수정 검증 — 클라이언트 폼과 BFF(/api/profile)가 함께 사용 */

export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export function nicknameError(value: string) {
  const length = value.trim().length;
  if (length === 0) return "닉네임을 입력해주세요.";
  if (length < 2 || length > 12) return "닉네임은 2~12자로 입력해주세요.";
  return undefined;
}

export function avatarError(file: File) {
  if (!AVATAR_TYPES.includes(file.type)) return "JPG·PNG·WEBP 사진만 올릴 수 있어요.";
  if (file.size > AVATAR_MAX_BYTES) return "사진은 5MB 이하로 올려주세요.";
  return undefined;
}

/** PATCH /api/profile 실패 응답 */
export interface ProfileErrorBody {
  field?: "nickname" | "avatar";
  message: string;
}
