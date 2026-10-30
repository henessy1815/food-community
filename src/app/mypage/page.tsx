import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MyPageScreen } from "@/components/screens/MyPageScreen";
import { Spinner } from "@/components/ui/Spinner";
import { getCurrentUser } from "@/lib/auth";
import { listPlaces } from "@/lib/places";

export const metadata: Metadata = { title: "마이 페이지 · 구로 맛길" };

export default function MyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <MyPageContent />
    </Suspense>
  );
}

async function MyPageContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mypage");

  const myPosts = await listPlaces({ userId: user.id });
  return <MyPageScreen user={user} myPosts={myPosts} />;
}
