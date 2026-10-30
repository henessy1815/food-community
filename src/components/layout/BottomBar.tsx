import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { containerClass, type ContainerSize } from "./Container";

/** 화면 하단 고정 액션 영역 (등록하기 · 저장하기 · 길찾기) */
export function BottomBar({
  size = "narrow",
  className,
  children,
}: {
  size?: ContainerSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 w-full border-t border-border-default bg-background-default",
        className,
      )}
    >
      <div
        className={cn(
          containerClass[size],
          "flex flex-col items-center gap-(--spacing-8) pt-(--spacing-12) pb-(--spacing-20)",
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
