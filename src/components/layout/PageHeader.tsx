"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TopNavigation, type NavAction } from "@/components/ui/TopNavigation";
import type { ContainerSize } from "./Container";

export interface PageHeaderProps {
  title?: ReactNode;
  /** 뒤로가기 버튼 — true면 history back (기록 없으면 fallbackHref) */
  back?: boolean;
  /** 뒤로가기 동작을 가로챔 (예: 작성 중 이탈 경고) */
  onBack?: () => void;
  fallbackHref?: string;
  rightActions?: NavAction[];
  trailing?: ReactNode;
  /** 본문 Container와 같은 폭으로 정렬 */
  size?: ContainerSize;
}

/** TopNavigation을 화면 상단에 고정하고 본문 폭에 맞춰 정렬 */
export function PageHeader({
  title,
  back = false,
  onBack,
  fallbackHref = "/",
  rightActions,
  trailing,
  size = "wide",
}: PageHeaderProps) {
  const router = useRouter();
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };

  return (
    <div className="sticky top-0 z-30 w-full bg-background-default">
      <div
        className={cn(
          "mx-auto w-full",
          size === "wide"
            ? "max-w-[1280px] md:px-(--spacing-8) lg:px-(--spacing-16)"
            : "max-w-[640px] md:px-(--spacing-8)",
        )}
      >
        <TopNavigation
          title={title}
          leftAction={back ? { icon: "arrow-left", label: "뒤로가기", onClick: onBack ?? goBack } : undefined}
          rightActions={rightActions}
          trailing={trailing}
        />
      </div>
    </div>
  );
}
