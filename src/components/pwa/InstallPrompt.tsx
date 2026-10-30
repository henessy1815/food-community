"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { InstallBanner, type InstallPlatform } from "./InstallBanner";
import { InstallGuide } from "./InstallGuide";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** 하단 고정 버튼(BottomBar)이 없는 탭 화면에서만 노출 */
const BANNER_PATHS = new Set(["/", "/search", "/mypage"]);
const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 7;

// beforeinstallprompt는 하이드레이션 전에 올 수 있어 모듈 로드 시점부터 잡아 둔다
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // 브라우저 기본 미니 인포바 대신 띠배너로 유도
    deferredPrompt = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    emit();
  });
}

const subscribePrompt = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const noopSubscribe = () => () => {};

function detectPlatform(): InstallPlatform | null {
  const ua = navigator.userAgent;
  // 카카오톡 인앱 브라우저는 설치(PWA)를 지원하지 않아 외부 브라우저로 넘겨야 한다 (UA에 Android/iPhone도 포함되므로 먼저 판별)
  if (/kakaotalk/i.test(ua)) return "kakao";
  if (/android/i.test(ua)) return "android";
  // iPadOS 13+는 데스크톱 Safari UA를 쓰므로 터치 지원으로 구분
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return null;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isRecentlyDismissed() {
  const at = Number(localStorage.getItem(DISMISS_KEY));
  return Boolean(at) && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

/** PWA 설치 유도 — 플랫폼 판별 · 설치 프롬프트 · 닫기(7일) 상태를 관리 */
export function InstallPrompt() {
  const pathname = usePathname();
  const prompt = useSyncExternalStore(subscribePrompt, () => deferredPrompt, () => null);
  const justInstalled = useSyncExternalStore(subscribePrompt, () => installed, () => false);
  const platform = useSyncExternalStore(noopSubscribe, detectPlatform, () => null);
  const eligible = useSyncExternalStore(
    noopSubscribe,
    () => !isStandalone() && !isRecentlyDismissed(),
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const spacerRef = useRef<HTMLDivElement>(null);

  const visible =
    BANNER_PATHS.has(pathname) &&
    eligible &&
    !dismissed &&
    !justInstalled &&
    platform !== null;

  // 배너 높이만큼 문서 하단에 여백을 두고, 고정 요소(FAB)가 피할 수 있게 CSS 변수로 공유
  useEffect(() => {
    const spacer = spacerRef.current;
    const banner = spacer?.firstElementChild;
    if (!spacer || !banner) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      const height = `${banner.getBoundingClientRect().height}px`;
      spacer.style.height = height;
      root.style.setProperty("--install-banner-h", height);
    });
    observer.observe(banner);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--install-banner-h");
    };
  }, [visible]);

  if (!platform) return null;

  const install = async () => {
    if (platform === "kakao") {
      // 기기 기본 브라우저로 현재 페이지를 연다 (안드로이드 · iOS 공통 카카오톡 스킴)
      location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(location.href)}`;
      return;
    }
    // iOS · 프롬프트를 주지 않는 안드로이드 브라우저(삼성 인터넷 등)는 수동 설치 가이드
    if (platform === "ios" || !prompt) {
      setGuideOpen(true);
      return;
    }
    deferredPrompt = null; // prompt()는 이벤트당 한 번만 호출 가능
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setDismissed(true);
    emit();
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <>
      {visible && (
        <div ref={spacerRef}>
          <InstallBanner platform={platform} onInstall={install} onDismiss={dismiss} />
        </div>
      )}
      {platform !== "kakao" && (
        <InstallGuide platform={platform} open={guideOpen} onClose={() => setGuideOpen(false)} />
      )}
    </>
  );
}
