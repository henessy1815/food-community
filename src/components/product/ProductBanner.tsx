"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/foundations/Icon";
import { PageBadge } from "@/components/ui/PageBadge";
import { cn } from "@/lib/cn";
import { bannerWhen, seatsLabel, type Product } from "@/lib/products";

export interface ProductBannerProps {
  /** 판매 중 → 마감 순으로 정렬된 상품 — 비어 있으면 배너를 숨긴다 */
  products: Product[];
  /** 자동 넘김 간격(ms) · 0이면 끄기 */
  interval?: number;
  className?: string;
}

/** 메인 상단 강연·모임 배너 — 스와이프(scroll-snap) · 자동 넘김 · 쪽번호 배지 · 도트 */
export function ProductBanner({ products, interval = 5000, className }: ProductBannerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = products.length;

  const goTo = (i: number) => {
    const el = trackRef.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // 자동 넘김 — 사용자가 보고 있거나(hover·focus·touch) 동작 줄이기 설정이면 멈춤
  useEffect(() => {
    if (!interval || count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, interval);
    return () => clearInterval(timer);
  }, [interval, count, paused]);

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="강연·모임"
      className={cn("flex min-w-0 flex-col gap-(--spacing-8)", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex h-[240px] w-full snap-x snap-mandatory overflow-x-auto bg-background-muted [scrollbar-width:none] md:rounded-[18px]"
      >
        {products.map((p, i) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="relative flex size-full shrink-0 snap-center items-end p-(--spacing-16) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-brand"
          >
            <Image
              src={p.bannerImage.src}
              alt=""
              fill
              priority={i === 0}
              sizes="(max-width: 767px) 100vw, 640px"
              className="object-cover"
            />
            {/* 하단 텍스트 가독성용 그라데이션 — 배너 이미지 자체는 원래 밝기로 보이게 아래쪽만 어둡게 */}
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-background-overlay/70 via-background-overlay/25 to-transparent"
            />
            <div className="relative flex w-full items-end justify-between gap-(--spacing-12)">
              <div className="flex min-w-0 flex-1 flex-col gap-[6px] text-text-inverse">
                <p className="truncate heading-md">{p.title}</p>
                <p className="flex items-center gap-(--spacing-8)">
                  <span className="flex items-center gap-[4px]">
                    <Icon name="calendar" size={16} />
                    <span className="label-md">{bannerWhen(p)}</span>
                  </span>
                  <span className="flex items-center gap-[4px]">
                    <Icon name="user" size={16} />
                    <span className="label-lg">{seatsLabel(p)}</span>
                  </span>
                </p>
              </div>
              <PageBadge current={i + 1} total={count} />
            </div>
          </Link>
        ))}
      </div>

      {count > 1 && (
        <div className="flex items-center justify-center gap-[5px]">
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`${i + 1}번째 배너 보기`}
              aria-current={i === index || undefined}
              onClick={() => goTo(i)}
              className={cn(
                "h-[6px] cursor-pointer rounded-[3px] transition-[width,background-color]",
                i === index ? "w-[16px] bg-background-brand" : "w-[6px] bg-background-strong",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
