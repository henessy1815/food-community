import { useEffect, useRef, useState } from "react";
import { loadNaverMaps, type NaverMap } from "@/lib/naver-maps";

export interface MapCenter {
  lat: number;
  lng: number;
}

/** 네이버 지역 검색 좌표와 같은 정밀도(1e-7)로 맞춘다 */
const round = (value: number) => Math.round(value * 1e7) / 1e7;

/**
 * 네이버 지도(JS SDK)를 ref 요소에 만든다 — 중심 좌표가 바뀌면 다시 만든다
 * - interactive: 드래그·줌 가능 + 줌 컨트롤 / false면 보기 전용
 * - onIdle: 지도 이동이 끝날 때마다 중심 좌표
 */
export function useNaverMap(
  center: MapCenter,
  {
    interactive = false,
    onDragStart,
    onIdle,
  }: { interactive?: boolean; onDragStart?: () => void; onIdle?: (center: MapCenter) => void } = {},
) {
  const ref = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onDragStart, onIdle });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const { lat, lng } = center;

  useEffect(() => {
    handlers.current = { onDragStart, onIdle };
  });

  useEffect(() => {
    let map: NaverMap | undefined;
    let cancelled = false;
    window.navermap_authFailure = () => setStatus("error");

    loadNaverMaps()
      .then((maps) => {
        if (cancelled || !ref.current) return;
        const created = new maps.Map(ref.current, {
          center: new maps.LatLng(lat, lng),
          zoom: 16,
          scaleControl: false,
          mapDataControl: false,
          ...(interactive
            ? { zoomControl: true, zoomControlOptions: { position: maps.Position.TOP_RIGHT } }
            : {
                draggable: false,
                pinchZoom: false,
                scrollWheel: false,
                keyboardShortcuts: false,
                disableDoubleTapZoom: true,
                disableDoubleClickZoom: true,
                disableTwoFingerTapZoom: true,
              }),
        });
        maps.Event.addListener(created, "dragstart", () => handlers.current.onDragStart?.());
        maps.Event.addListener(created, "idle", () => {
          const c = created.getCenter();
          handlers.current.onIdle?.({ lat: round(c.lat()), lng: round(c.lng()) });
        });
        map = created;
        setStatus("ready");
      })
      .catch((error: unknown) => {
        console.error(error);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      map?.destroy();
      delete window.navermap_authFailure;
    };
  }, [lat, lng, interactive]);

  return { ref, status };
}
