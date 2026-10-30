"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import type { Photo } from "@/lib/restaurants";

/** 상세 사진 캐러셀 — 스와이프(scroll-snap) + 카운터 뱃지 + 도트 */
export function PhotoCarousel({ photos, className }: { photos: Photo[]; className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section aria-roledescription="carousel" aria-label="맛집 사진" className={cn("flex flex-col", className)}>
      <div className="relative h-[280px] w-full overflow-hidden bg-background-muted md:h-[400px] lg:rounded-[16px]">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex size-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
        >
          {photos.map((photo, i) => (
            <div
              key={photo.src + i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${photos.length}`}
              className="relative size-full shrink-0 snap-center"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                priority={i === 0}
                sizes="(max-width: 1023px) 100vw, 800px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <Badge className="absolute right-(--spacing-12) bottom-(--spacing-12)">
          {index + 1} / {photos.length}
        </Badge>
      </div>
      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-[5px] pt-(--spacing-12)">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}번째 사진 보기`}
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
