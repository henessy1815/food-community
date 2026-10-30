import type { MetadataRoute } from "next";
import { SPLASH_BACKGROUND } from "@/lib/pwa/apple-splash";

/**
 * PWA manifest — 안드로이드 설치 · 스플래시(name + background_color + 아이콘)
 * 아이콘은 scripts/generate-pwa-assets.mjs 로 logo.png에서 생성
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "구로 맛길",
    short_name: "구로 맛길",
    description: "구로 이웃이 차 타고 직접 다녀온 주말 맛집",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: SPLASH_BACKGROUND,
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
