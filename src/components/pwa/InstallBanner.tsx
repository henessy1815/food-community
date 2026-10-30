import Image from "next/image";
import { Icon } from "@/components/foundations/Icon";

export type InstallPlatform = "android" | "ios" | "kakao";

const copy: Record<InstallPlatform, { description: string; action: string }> = {
  android: { description: "홈 화면에서 바로 맛집을 찾아보세요", action: "설치" },
  ios: { description: "홈 화면에서 바로 맛집을 찾아보세요", action: "설치 방법" },
  kakao: { description: "브라우저에서 열면 앱으로 설치할 수 있어요", action: "브라우저로 열기" },
};

/**
 * 하단 고정 앱 설치 유도 띠배너 — 다른 UI 컴포넌트를 재사용하지 않는 전용 마크업
 * - android: 배너 탭 → 브라우저 설치 프롬프트 (프롬프트가 없으면 홈 화면 추가 가이드)
 * - ios: 배너 탭 → 홈 화면 추가 가이드(바텀시트)
 * - kakao: 카카오톡 인앱 브라우저 — 배너 탭 → 외부 브라우저로 열기
 */
export function InstallBanner({
  platform,
  onInstall,
  onDismiss,
}: {
  platform: InstallPlatform;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <aside
      aria-label="앱 설치 안내"
      className="fixed inset-x-0 bottom-0 z-40 bg-background-inverse text-text-inverse pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center gap-(--spacing-8) py-(--spacing-12) pr-(--spacing-8) pl-(--spacing-16) md:pl-(--spacing-24)">
        <button
          type="button"
          onClick={onInstall}
          className="flex min-w-0 flex-1 items-center gap-(--spacing-12) text-left outline-none focus-visible:ring-2 focus-visible:ring-border-brand rounded-[12px]"
        >
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={40}
            height={40}
            className="size-[40px] shrink-0"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="truncate label-lg">구로 맛길 앱 설치하기</span>
            <span className="truncate label-md text-text-inverse/70">{copy[platform].description}</span>
          </span>
          <span className="shrink-0 rounded-full bg-background-brand px-(--spacing-12) py-[6px] label-md text-text-on-brand">
            {copy[platform].action}
          </span>
        </button>
        <button
          type="button"
          aria-label="설치 안내 닫기"
          onClick={onDismiss}
          className="flex size-[40px] shrink-0 items-center justify-center rounded-full text-text-inverse/70 outline-none hover:text-text-inverse focus-visible:ring-2 focus-visible:ring-border-brand"
        >
          <Icon name="close" size={20} />
        </button>
      </div>
    </aside>
  );
}
