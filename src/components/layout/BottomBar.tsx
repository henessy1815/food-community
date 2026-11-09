import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { containerClass, type ContainerSize } from "./Container";

/** 화면 하단 고정 액션 영역 (등록하기 · 저장하기 · 길찾기 · 결제하기) */
export function BottomBar({
  size = "narrow",
  direction = "column",
  bordered = true,
  className,
  children,
}: {
  size?: ContainerSize;
  /** row: 가격 | 버튼 (gap 16) · 버튼 두 개 나란히는 자식에 flex-1 */
  direction?: "column" | "row";
  /** 상단 구분선 — 결제 결과처럼 본문과 이어지는 화면은 false */
  bordered?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 w-full bg-background-default",
        bordered && "border-t border-border-default",
        className,
      )}
    >
      <div
        className={cn(
          containerClass[size],
          "flex items-center pt-(--spacing-12) pb-(--spacing-20)",
          direction === "column" ? "flex-col gap-(--spacing-8)" : "flex-row gap-(--spacing-16)",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** 섹션 구분 8px 띠 */
export function SectionDivider({ className }: { className?: string }) {
  return <div aria-hidden className={cn("h-[8px] w-full bg-background-muted", className)} />;
}
