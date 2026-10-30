import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * 반응형 콘텐츠 폭
 * - wide: 카드 그리드 화면 — 최대 1280px, 그 이상은 좌우 여백
 * - narrow: 폼 · 로그인 등 단일 컬럼 화면 — 최대 640px 중앙 정렬
 * 좌우 마진: 모바일 16 · 태블릿 24 · 데스크톱 32 (spacing 토큰)
 */
export type ContainerSize = "wide" | "narrow";

export const containerClass: Record<ContainerSize, string> = {
  wide: "mx-auto w-full max-w-[1280px] px-(--spacing-16) md:px-(--spacing-24) lg:px-(--spacing-32)",
  narrow: "mx-auto w-full max-w-[640px] px-(--spacing-16) md:px-(--spacing-24)",
};

export function Container({
  size = "wide",
  as: Component = "div",
  className,
  children,
}: {
  size?: ContainerSize;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return <Component className={cn(containerClass[size], className)}>{children}</Component>;
}
