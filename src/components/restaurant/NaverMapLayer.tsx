"use client";

import { useNaverMap } from "@/hooks/useNaverMap";

/** 보기 전용 네이버 지도 — 부모 박스를 채우고, 클릭은 부모(길찾기 링크)로 넘긴다. 못 불러오면 빈 배경 */
export function NaverMapLayer({ lat, lng }: { lat: number; lng: number }) {
  const { ref } = useNaverMap({ lat, lng });
  // SDK가 지도 요소에 position: relative를 덮어쓰므로 크기는 바깥 래퍼가 잡는다
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 isolate">
      <div ref={ref} className="h-full w-full" />
    </div>
  );
}
