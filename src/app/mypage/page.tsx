import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MyPageScreen } from "@/components/screens/MyPageScreen";
import { Spinner } from "@/components/ui/Spinner";
import { getCurrentUser } from "@/lib/auth";
import { MY_PAGE_TABS, type MyPageTab } from "@/lib/mypage";
import { listPlaces } from "@/lib/places";
import { listCancellations, listPayments } from "@/lib/shop";

export const metadata: Metadata = { title: "마이 페이지 · 구로 맛길" };

export default function MyPage({ searchParams }: PageProps<"/mypage">) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      {searchParams.then(({ tab }) => (
        <MyPageContent tab={MY_PAGE_TABS.find((t) => t.value === tab)?.value} />
      ))}
    </Suspense>
  );
}

async function MyPageContent({ tab }: { tab?: MyPageTab }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/mypage${tab ? `?tab=${tab}` : ""}`);

  const [myPosts, payments, cancellations] = await Promise.all([
    listPlaces({ userId: user.id }),
    listPayments(user.id),
    listCancellations(user.id),
  ]);
  return (
    <MyPageScreen
      user={user}
      myPosts={myPosts}
      payments={payments}
      cancellations={cancellations}
      initialTab={tab}
    />
  );
}
