"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BottomBar } from "@/components/layout/BottomBar";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Toast } from "@/components/ui/Toast";
import { AVATAR_TYPES, avatarError, nicknameError, type ProfileErrorBody } from "@/lib/profile";

export interface ProfileEditUser {
  nickname: string;
  avatar: string;
}

export function ProfileEditScreen({ user }: { user: ProfileEditUser }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(user.avatar);
  const [file, setFile] = useState<File | null>(null);
  const [nickname, setNickname] = useState(user.nickname);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const error = nicknameError(nickname) ?? serverError;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (error) return;

    const body = new FormData();
    body.set("nickname", nickname.trim());
    if (file) body.set("avatar", file);

    setSaving(true);
    try {
      const res = await fetch("/api/profile", { method: "PATCH", body });
      if (!res.ok) {
        const { field, message } = (await res.json()) as ProfileErrorBody;
        if (field === "nickname") setServerError(message);
        else setToast(message);
        return;
      }
      router.push("/mypage");
      router.refresh();
    } catch {
      setToast("프로필을 저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={onSubmit} className="flex min-h-dvh flex-col">
      <PageHeader back title="프로필 수정" fallbackHref="/mypage" size="narrow" />

      <Container size="narrow" as="main" className="flex flex-1 flex-col gap-(--spacing-32) py-(--spacing-24)">
        <div className="flex flex-col items-center gap-(--spacing-12)">
          <Image
            src={avatar}
            alt="프로필 사진"
            width={96}
            height={96}
            className="size-[96px] rounded-full object-cover"
          />
          <input
            ref={fileRef}
            type="file"
            accept={AVATAR_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const picked = e.target.files?.[0];
              e.target.value = "";
              if (!picked) return;
              const pickedError = avatarError(picked);
              if (pickedError) return setToast(pickedError);
              setFile(picked);
              setAvatar(URL.createObjectURL(picked));
            }}
          />
          <Button variant="secondary" size="sm" iconLeft="camera" onClick={() => fileRef.current?.click()}>
            사진 변경
          </Button>
        </div>

        <TextField
          size="lg"
          label="닉네임"
          maxLength={12}
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setServerError(undefined);
          }}
          onBlur={() => setTouched(true)}
          onClear={() => setNickname("")}
          helperText="2~12자, 다른 사람과 겹치지 않는 닉네임"
          errorMessage={touched ? error : undefined}
        />
      </Container>

      <BottomBar>
        <Button type="submit" size="lg" fullWidth loading={saving}>
          저장하기
        </Button>
      </BottomBar>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[96px] z-40 flex justify-center px-(--spacing-16)">
          <Toast type="error">{toast}</Toast>
        </div>
      )}
    </form>
  );
}
