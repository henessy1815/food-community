"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { RestaurantGrid } from "@/components/restaurant/RestaurantGrid";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { IconButton } from "@/components/ui/IconButton";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { TextField } from "@/components/ui/TextField";
import { listMeta, type Restaurant } from "@/lib/restaurants";

const PAGE_SIZE = 4;

export interface WeeklyStats {
  period: string;
  count: number;
}

/** restaurants: 최신순 */
export function HomeScreen({ restaurants, weeklyStats }: { restaurants: Restaurant[]; weeklyStats: WeeklyStats }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = visible < restaurants.length;

  // 무한 스크롤: 하단 로더가 보이면 다음 페이지
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) timer = setTimeout(() => setVisible((v) => v + PAGE_SIZE), 600);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [hasMore, visible]);

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title={<Logo />}
        rightActions={[{ icon: "user", label: "마이 페이지", onClick: () => router.push("/mypage") }]}
      />

      <Container
        as="main"
        className="flex flex-1 flex-col gap-(--spacing-24) pt-(--spacing-12) pb-(--spacing-32)"
      >
        {/* Hero — 태블릿 이상에서 인사말·검색 | 주간 배너 2단 */}
        <section className="grid gap-(--spacing-24) md:grid-cols-2 md:items-end md:gap-(--spacing-32)">
          <div className="flex flex-col gap-(--spacing-24)">
            <div className="flex flex-col gap-[2px]">
              <p className="heading-lg text-text-default">이번 주말엔</p>
              <p className="heading-lg text-text-default">
                <span className="text-text-brand">새로운 맛집</span>으로 가볼까요?
              </p>
              <p className="body-md text-text-secondary">구로 이웃이 차 타고 직접 다녀온 곳만 모았어요</p>
            </div>
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                const q = query.trim();
                if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
              }}
            >
              <TextField
                size="lg"
                iconLeft="search"
                type="text"
                enterKeyHint="search"
                aria-label="맛집 검색"
                placeholder="맛집 이름, 내용으로 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
          </div>

          <section
            aria-label="이번 주 새로 올라온 곳"
            className="flex flex-col gap-(--spacing-12) rounded-[18px] border border-border-default bg-background-default p-(--spacing-16)"
          >
            <div className="flex items-center justify-between">
              <Badge>이번 주 새로 올라온 곳</Badge>
              <span className="label-md text-text-secondary">{weeklyStats.period}</span>
            </div>
            <p className="flex items-end gap-[2px] text-text-brand">
              <span className="display-lg">{weeklyStats.count}</span>
              <span className="heading-sm">곳</span>
            </p>
          </section>
        </section>

        <section aria-labelledby="latest-title" className="flex flex-col gap-(--spacing-12)">
          <h2 id="latest-title" className="heading-sm text-text-default">
            방금 올라온 맛집
          </h2>

          {restaurants.length === 0 ? (
            <Empty
              visual="map-pinned"
              title="아직 올라온 맛집이 없어요"
              description="다녀온 숨은 맛집을 처음으로 소개해 주세요."
              primaryAction={{ label: "맛집 등록", icon: "plus", onClick: () => router.push("/restaurants/new") }}
              className="mx-auto max-w-[400px] py-(--spacing-32)"
            />
          ) : (
            <RestaurantGrid restaurants={restaurants.slice(0, visible)} meta={listMeta} />
          )}

          {restaurants.length === 0 ? null : hasMore ? (
            <div ref={sentinelRef} className="flex items-center justify-center gap-(--spacing-8) pt-(--spacing-12)">
              <Spinner label="맛집을 더 불러오는 중" />
              <span className="label-md text-text-tertiary">맛집을 더 불러오는 중이에요</span>
            </div>
          ) : (
            <p className="py-(--spacing-12) text-center label-md text-text-tertiary">마지막 글입니다</p>
          )}
        </section>
      </Container>

      {/* FAB — 콘텐츠 폭(최대 1280) 우측 하단에 정렬 · 설치 띠배너가 있으면 그 위로 */}
      <div className="pointer-events-none fixed inset-x-0 bottom-(--install-banner-h) z-20">
        <div className="mx-auto flex max-w-[1280px] justify-end px-(--spacing-16) pb-(--spacing-24) md:px-(--spacing-24) lg:px-(--spacing-32)">
          <IconButton
            icon="plus"
            label="맛집 등록"
            variant="circle-brand"
            onClick={() => router.push("/restaurants/new")}
            className="pointer-events-auto shadow-[0_6px_16px_var(--color-shadow-brand)]"
          />
        </div>
      </div>
    </div>
  );
}
