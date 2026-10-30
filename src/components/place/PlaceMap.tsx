"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useNaverMap, type MapCenter } from "@/hooks/useNaverMap";
import { cn } from "@/lib/cn";
import { SEOUL_CITY_HALL } from "@/lib/naver-maps";

export type { MapCenter };

/**
 * 네이버 지도(JS SDK) — 핀은 지도 중심에 고정, 지도를 움직여 위치를 맞춘다
 * - 좌표가 없으면 서울시청에서 시작
 * - 지도 이동이 끝날 때마다(idle) 중심 좌표를 onMove로 알린다
 */
export function PlaceMap({
  label,
  lat,
  lng,
  onMove,
  className,
}: {
  /** 핀 위 말풍선 — 없으면 핀만 */
  label?: string;
  lat?: number;
  lng?: number;
  onMove?: (center: MapCenter) => void;
  className?: string;
}) {
  // 지도는 처음 좌표로 한 번만 만들고, 이후 좌표는 지도에서 나온다
  const [initial] = useState(() =>
    lat !== undefined && lng !== undefined ? { lat, lng } : SEOUL_CITY_HALL,
  );
  const [dragging, setDragging] = useState(false);
  const { ref, status } = useNaverMap(initial, {
    interactive: true,
    onDragStart: () => setDragging(true),
    onIdle: (center) => {
      setDragging(false);
      onMove?.(center);
    },
  });

  return (
    <div
      className={cn(
        "relative min-h-[240px] w-full flex-1 overflow-hidden rounded-[16px] border border-border-default bg-background-muted",
        className,
      )}
    >
      {/* SDK가 지도 요소에 position: relative를 덮어쓰므로 크기는 바깥 래퍼가 잡고,
          SDK 내부 z-index가 핀 위로 올라오지 않도록 쌓임 맥락을 가둔다 */}
      <div className="absolute inset-0 isolate">
        <div
          ref={ref}
          role="region"
          aria-label={`${label ?? "장소"} 위치 지도 — 지도를 움직여 핀 위치를 맞춰주세요`}
          className="h-full w-full"
        />
      </div>
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner label="지도 불러오는 중" />
        </div>
      )}
      {status === "error" && (
        <p className="absolute inset-x-0 bottom-(--spacing-12) text-center label-md text-text-tertiary">
          지도를 불러오지 못했어요
        </p>
      )}
      {/* 중심 고정 핀 — 마커 끝이 지도 중심에 오도록 위로 올리고, 드래그 중엔 살짝 띄운다 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="-translate-y-1/2">
          <span
            className={cn(
              "flex flex-col items-center transition-transform",
              dragging && "-translate-y-(--spacing-8)",
            )}
          >
            {label && <Badge>{label}</Badge>}
            <Image src="/images/naver-map-pin.png" alt="" width={55} height={36} className="h-[36px] w-[55px] object-contain" />
          </span>
        </span>
      </div>
    </div>
  );
}
