import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ProfileEditScreen } from "@/components/screens/ProfileEditScreen";
import { Spinner } from "@/components/ui/Spinner";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "프로필 수정 · 구로 맛길" };

export default function ProfileEditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <ProfileEditContent />
    </Suspense>
  );
}

async function ProfileEditContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mypage/edit");

  return <ProfileEditScreen user={{ nickname: user.nickname, avatar: user.avatar }} />;
}
