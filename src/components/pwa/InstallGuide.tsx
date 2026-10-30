import { Icon, type IconName } from "@/components/foundations/Icon";
import { BottomSheet } from "@/components/ui/BottomSheet";

export type InstallGuidePlatform = "ios" | "android";

const steps: Record<InstallGuidePlatform, { icon: IconName; title: string; description: string }[]> = {
  ios: [
    {
      icon: "ios-share",
      title: "공유 버튼 누르기",
      description: "Safari 하단(또는 상단) 주소창 옆 공유 버튼을 눌러요. 보이지 않으면 ··· 메뉴에서 공유를 선택해요.",
    },
    {
      icon: "square-plus",
      title: "‘홈 화면에 추가’ 선택",
      description: "메뉴를 아래로 내려 ‘홈 화면에 추가’를 눌러요.",
    },
    {
      icon: "check",
      title: "오른쪽 위 ‘추가’ 누르기",
      description: "홈 화면에 생긴 구로 맛길 아이콘으로 앱처럼 열 수 있어요.",
    },
  ],
  android: [
    {
      icon: "more-vertical",
      title: "브라우저 메뉴 열기",
      description: "Chrome은 오른쪽 위 ⋮, 삼성 인터넷은 하단 ≡ 메뉴를 눌러요.",
    },
    {
      icon: "square-plus",
      title: "‘홈 화면에 추가’ 선택",
      description: "Chrome은 ‘홈 화면에 추가’ 또는 ‘앱 설치’, 삼성 인터넷은 ‘현재 페이지 추가’ → ‘홈 화면’을 눌러요.",
    },
    {
      icon: "check",
      title: "‘설치’ 또는 ‘추가’ 누르기",
      description: "홈 화면에 생긴 구로 맛길 아이콘으로 앱처럼 열 수 있어요.",
    },
  ],
};

/**
 * 홈 화면 추가 가이드 바텀시트 — 브라우저 설치 프롬프트를 쓸 수 없을 때 수동 안내
 * - ios: Safari는 설치 프롬프트 API가 없음
 * - android: 브라우저가 beforeinstallprompt를 주지 않을 때(삼성 인터넷 등)
 */
export function InstallGuide({
  platform,
  open,
  onClose,
}: {
  platform: InstallGuidePlatform;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} label="홈 화면에 추가하는 방법">
      <div className="flex flex-col gap-[4px] pb-(--spacing-8)">
        <p className="heading-sm text-text-default">홈 화면에 추가하는 방법</p>
        <p className="body-md text-text-secondary">앱스토어 없이 3단계면 설치가 끝나요.</p>
      </div>
      <ol className="flex flex-col">
        {steps[platform].map((step, i) => (
          <li key={step.title} className="flex items-start gap-(--spacing-12) py-(--spacing-12)">
            <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-background-brand-subtle text-text-brand">
              <Icon name={step.icon} size={20} />
            </span>
            <span className="flex flex-col gap-[2px]">
              <span className="label-lg text-text-default">
                {i + 1}. {step.title}
              </span>
              <span className="label-md text-text-secondary">{step.description}</span>
            </span>
          </li>
        ))}
      </ol>
    </BottomSheet>
  );
}
