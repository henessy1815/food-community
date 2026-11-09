"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionDivider } from "@/components/layout/BottomBar";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { CancelHistoryItem, PaymentHistoryItem } from "@/components/product/OrderHistoryItem";
import { RestaurantGrid } from "@/components/restaurant/RestaurantGrid";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { Modal } from "@/components/ui/Modal";
import { TabNavigation } from "@/components/ui/TabNavigation";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { MY_PAGE_TABS, type MyPageTab } from "@/lib/mypage";
import { deletePlace } from "@/lib/place";
import { formatPrice, shortWhen, type Order, type OrderErrorBody } from "@/lib/products";
import { myPostMeta, type Restaurant } from "@/lib/restaurants";

export interface MyPageUser {
  nickname: string;
  email: string;
  avatar: string;
}


export interface MyPageScreenProps {
  user: MyPageUser;
  /** 내가 쓴 글 (최신순) */
  myPosts: Restaurant[];
  /** 결제 내역 (최신 결제순) */
  payments: Order[];
  /** 취소 내역 (최신 취소순) */
  cancellations: Order[];
  /** ?tab= 으로 들어온 첫 탭 */
  initialTab?: MyPageTab;
}

export function MyPageScreen({ user, myPosts, payments, cancellations, initialTab = "posts" }: MyPageScreenProps) {
  const router = useRouter();
  const [tab, setTab] = useState<MyPageTab>(initialTab);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [canceling, setCanceling] = useState(false);
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

  const changeTab = (value: string) => {
    setTab(value as MyPageTab);
    // 새로고침·뒤로 가기에도 같은 탭이 열리도록 주소만 바꾼다
    window.history.replaceState(null, "", `?tab=${value}`);
  };

  const confirmCancel = async () => {
    if (!cancelTarget || canceling) return;
    setCanceling(true);
    try {
      const res = await fetch(`/api/payments/${cancelTarget.id}/cancel`, { method: "POST" });
      if (!res.ok) {
        const { message } = (await res.json()) as OrderErrorBody;
        setToast({ type: "error", message });
      } else {
        setToast({ type: "success", message: "결제를 취소했어요. 취소 내역에서 확인할 수 있어요" });
      }
    } catch {
      setToast({ type: "error", message: "결제를 취소하지 못했어요." });
    }
    setCanceling(false);
    setCancelTarget(null);
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

        {/* 모바일은 탭 밑줄이 화면 끝까지 이어지도록 좌우 여백 없이 */}
        <Container className="max-md:px-0">
          <TabNavigation label="마이 페이지" items={MY_PAGE_TABS} value={tab} onValueChange={changeTab} />
        </Container>

        <Container className="pt-(--spacing-8) pb-(--spacing-24)">
          <section role="tabpanel" aria-label={MY_PAGE_TABS.find((t) => t.value === tab)?.label} className="flex flex-col">
          {tab === "posts" &&
            (myPosts.length === 0 ? (
              <Empty
                visual="edit"
                title="아직 쓴 글이 없어요"
                description="다녀온 숨은 맛집을 이웃에게 소개해 주세요."
                primaryAction={{ label: "맛집 등록", icon: "plus", onClick: () => router.push("/restaurants/new") }}
                className="py-(--spacing-32)"
              />
            ) : (
              <>
                <ListHeader count={myPosts.length} className="pb-(--spacing-12)" />
                <RestaurantGrid restaurants={myPosts} meta={myPostMeta} onDelete={setDeleteTarget} />
              </>
            ))}

          {tab === "payments" &&
            (payments.length === 0 ? (
              <Empty
                visual="calendar"
                title="아직 결제한 상품이 없어요"
                description="메인 화면 배너에서 이웃과 함께하는 맛집 모임·강연을 만나보세요."
                primaryAction={{ label: "모임 둘러보기", onClick: () => router.push("/") }}
                className="py-(--spacing-32)"
              />
            ) : (
              <>
                <ListHeader count={payments.length} className="py-(--spacing-8)" />
                <ul>
                  {payments.map((order) => (
                    <li key={order.id} className="border-b border-border-default last:border-b-0">
                      <PaymentHistoryItem order={order} onCancel={setCancelTarget} />
                    </li>
                  ))}
                </ul>
              </>
            ))}

          {tab === "cancels" &&
            (cancellations.length === 0 ? (
              <Empty
                visual="calendar"
                title="취소한 내역이 없어요"
                description="결제를 취소하면 환불 진행 상황을 여기서 볼 수 있어요."
                className="py-(--spacing-32)"
              />
            ) : (
              <>
                <ListHeader count={cancellations.length} className="py-(--spacing-8)" />
                <ul>
                  {cancellations.map((order) => (
                    <li key={order.id} className="border-b border-border-default last:border-b-0">
                      <CancelHistoryItem order={order} />
                    </li>
                  ))}
                </ul>
              </>
            ))}
          </section>
        </Container>

        <SectionDivider />

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
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="결제를 취소할까요?"
        secondaryAction={{ label: "닫기", onClick: () => setCancelTarget(null) }}
        primaryAction={{ label: "결제 취소", loading: canceling, onClick: confirmCancel }}
      >
        {cancelTarget && (
          <div className="flex flex-col gap-(--spacing-12)">
            <p>
              {cancelTarget.product.title} · {shortWhen(cancelTarget.product)}
            </p>
            <dl className="flex flex-col gap-(--spacing-8) rounded-[14px] bg-background-subtle p-(--spacing-12)">
              <div className="flex items-center justify-between">
                <dt>결제 금액</dt>
                <dd className="label-lg text-text-default">{formatPrice(cancelTarget.amount)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>환불 금액</dt>
                <dd className="heading-sm text-text-brand-strong">{formatPrice(cancelTarget.amount)}</dd>
              </div>
            </dl>
            <p className="label-md text-text-tertiary">
              결제한 카드로 3~5영업일 안에 환불돼요. 취소하면 자리가 다른 이웃에게 열려요.
            </p>
          </div>
        )}
      </Modal>

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

/** 총 N건 · 최신순 */
function ListHeader({ count, className }: { count: number; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className="label-md text-text-secondary">총 {count}건</span>
      <span className="label-md text-text-tertiary">최신순</span>
    </div>
  );
}
