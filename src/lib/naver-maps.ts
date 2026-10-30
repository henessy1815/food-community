/*
 * 네이버 지도 JS SDK(v3) 로더 — 브라우저 전용
 * 스크립트 주소(키 포함)는 BFF(/api/places/map/sdk)에서 받아 한 번만 삽입한다
 * @types/navermaps 대신 실제로 쓰는 API만 최소로 선언
 */

export interface NaverLatLng {
  lat(): number;
  lng(): number;
}

export interface NaverMap {
  getCenter(): NaverLatLng;
  destroy(): void;
}

export interface NaverMaps {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => NaverMap;
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  Position: Record<"TOP_RIGHT" | "BOTTOM_RIGHT", number>;
  Event: { addListener(target: NaverMap, name: "idle" | "dragstart", listener: () => void): unknown };
}

declare global {
  interface Window {
    naver?: { maps: NaverMaps };
    /** 키 인증 실패 시 SDK가 호출 (NCP 콘솔 Web 서비스 URL 미등록 등) */
    navermap_authFailure?: () => void;
  }
}

/** 기본 위치 — 서울시청 */
export const SEOUL_CITY_HALL = { lat: 37.5666103, lng: 126.9783882 };

let sdk: Promise<NaverMaps> | null = null;

export function loadNaverMaps(): Promise<NaverMaps> {
  if (window.naver?.maps) return Promise.resolve(window.naver.maps);
  sdk ??= (async () => {
    const res = await fetch("/api/places/map/sdk");
    if (!res.ok) throw new Error(`지도 SDK 주소 조회 실패: ${res.status}`);
    const { src } = (await res.json()) as { src: string };
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("지도 SDK 로드 실패"));
      document.head.append(script);
    });
    if (!window.naver?.maps) throw new Error("지도 SDK 초기화 실패");
    return window.naver.maps;
  })().catch((error: unknown) => {
    // 실패하면 다음 시도에서 다시 받는다
    sdk = null;
    throw error;
  });
  return sdk;
}
