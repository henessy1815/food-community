import { cn } from "@/lib/cn";

export interface PageBadgeProps {
  /** 1부터 시작 */
  current: number;
  total: number;
  className?: string;
}

/** 이미지 위 쪽번호 — 반투명 검은 배경 · 현재 | 전체 */
export function PageBadge({ current, total, className }: PageBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-[6px] h-[28px] rounded-full bg-background-overlay/60 px-[10px] whitespace-nowrap",
        className,
      )}
    >
      <span className="sr-only">
        {total}장 중 {current}번째
      </span>
      <span aria-hidden className="label-lg text-text-inverse">
        {current}
      </span>
      <span aria-hidden className="h-[10px] w-px bg-text-inverse/40" />
      <span aria-hidden className="label-md text-text-inverse/70">
        {total}
      </span>
    </span>
  );
}
