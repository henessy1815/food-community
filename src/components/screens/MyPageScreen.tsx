"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionDivider } from "@/components/layout/BottomBar";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { RestaurantGrid } from "@/components/restaurant/RestaurantGrid";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { deletePlace } from "@/lib/place";
import { myPostMeta, type Restaurant } from "@/lib/restaurants";

export interface MyPageUser {
  nickname: string;
  email: string;
  avatar: string;
}

/** myPosts: 내가 쓴 글 (최신순) */
export function MyPageScreen({ user, myPosts }: { user: MyPageUser; myPosts: Restaurant[] }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const error = await deletePlace(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) return setToast({ type: "error", message: error });
    setToast({ type: "success", message: "맛집을 삭제했어요" });
    router.refresh();
  };

  const signOut = async () => {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader back title="마이 페이지" />

      <main className="flex flex-1 flex-col">
        <Container className="flex items-center gap-(--spacing-16) pt-(--spacing-16) pb-(--spacing-24)">
          <Image
            src={user.avatar}
            alt=""
            width={64}
            height={64}
            className="size-[64px] shrink-0 rounded-full object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <h2 className="heading-md text-text-default">{user.nickname}</h2>
            <p className="truncate label-md text-text-tertiary">{user.email}</p>
          </div>
          <Button variant="secondary" size="sm" iconLeft="edit" onClick={() => router.push("/mypage/edit")}>
            프로필 수정
          </Button>
        </Container>

        <SectionDivider />

        <Container as="section" aria-labelledby="my-posts" className="flex flex-col gap-(--spacing-12) py-(--spacing-24)">
          <div className="flex items-center gap-(--spacing-8)">
            <h2 id="my-posts" className="heading-sm text-text-default">
              내가 쓴 글
            </h2>
            <Badge>{myPosts.length}</Badge>
          </div>
          <RestaurantGrid restaurants={myPosts} meta={myPostMeta} onDelete={setDeleteTarget} />
        </Container>

        <Container className="pt-(--spacing-8) pb-(--spacing-32)">
          <Button
            variant="secondary"
            size="lg"
            iconLeft="logout"
            fullWidth
            className="md:w-[320px]"
            loading={signingOut}
            onClick={signOut}
          >
            로그아웃
          </Button>
        </Container>
      </main>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-(--spacing-32) z-40 flex justify-center px-(--spacing-16)">
          <Toast type={toast.type}>{toast.message}</Toast>
        </div>
      )}

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="맛집을 삭제할까요?"
        secondaryAction={{ label: "취소", onClick: () => setDeleteTarget(null) }}
        primaryAction={{ label: "삭제", destructive: true, loading: deleting, onClick: confirmDelete }}
      >
        ‘{deleteTarget?.name}’ 글을 삭제하면 목록과 검색에서 더 이상 보이지 않아요.
      </Modal>
    </div>
  );
}
