import { cn } from "@/lib/cn";

export type SkeletonVariant = "text" | "rect" | "circle";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** text·rect: 대상 요소의 너비 (기본 100%) */
  width?: number | string;
  /** text: 대상 요소의 행 높이 · rect: 높이 · circle: 지름 */
  height?: number | string;
  className?: string;
}

const defaults: Record<SkeletonVariant, { width: number | string; height: number }> = {
  text: { width: "100%", height: 20 },
  rect: { width: 96, height: 96 },
  circle: { width: 40, height: 40 },
};

export function Skeleton({ variant = "text", width, height, className }: SkeletonProps) {
  const h = height ?? defaults[variant].height;
  const w = variant === "circle" ? h : (width ?? defaults[variant].width);
  return (
    <span
      aria-hidden
      data-variant={variant}
      style={{ width: w, height: h }}
      className={cn(
        "block shrink-0 animate-pulse bg-background-muted",
        variant === "text" && "rounded-[4px]",
        variant === "rect" && "rounded-[12px]",
        variant === "circle" && "rounded-full",
        className,
      )}
    />
  );
}
