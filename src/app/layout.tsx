import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { appleSplashScreens } from "@/lib/pwa/apple-splash";
import { pretendard } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "구로 맛길",
  description: "구로 이웃이 차 타고 직접 다녀온 주말 맛집",
  applicationName: "구로 맛길",
  // iOS 홈 화면 앱 — 스플래시는 기기 해상도별 이미지가 있어야 표시된다
  appleWebApp: {
    capable: true,
    title: "구로 맛길",
    statusBarStyle: "default",
    startupImage: appleSplashScreens,
  },
  // 구형 iOS는 apple- 접두사 메타가 있어야 startupImage를 사용한다
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full`}>
      <body className="h-full">
        {children}
        {/* 경로(usePathname)는 런타임 값 — 정적 셸을 막지 않도록 Suspense 안에서 */}
        <Suspense>
          <InstallPrompt />
        </Suspense>
      </body>
    </html>
  );
}
