import { Icon } from "@/components/foundations/Icon";
import { cn } from "@/lib/cn";

const sizeClass = {
  md: {
    mark: "size-[32px] rounded-[16px_16px_16px_4px] shadow-[0_3px_8px_var(--color-shadow-brand)]",
    icon: 20,
    word: "heading-sm",
  },
  lg: {
    mark: "size-[56px] rounded-[28px_28px_28px_6px] shadow-[0_6px_16px_var(--color-shadow-brand)]",
    icon: 24,
    word: "heading-md",
  },
} as const;

/**
 * 구로 맛길 로고 — 말풍선 모양 브랜드 마크(자동차) + "구로 맛길" 워드마크("맛길"만 브랜드 컬러)
 * - md: 상단 내비게이션 / lg: 로그인 화면
 * - 워드마크는 텍스트라 스크린리더에 "구로 맛길"로 읽힌다
 */
export function Logo({
  size = "md",
  tagline,
  as: Word = "span",
  className,
}: {
  size?: keyof typeof sizeClass;
  /** 워드마크 아래 보조 문구 (주말 맛집 드라이브) */
  tagline?: string;
  /** 워드마크 요소 — 페이지 제목이면 h1 */
  as?: "span" | "h1";
  className?: string;
}) {
  const s = sizeClass[size];
  return (
    <span className={cn("inline-flex items-center", size === "lg" ? "gap-(--spacing-12)" : "gap-(--spacing-8)", className)}>
      <span
        aria-hidden
        className={cn("flex shrink-0 items-center justify-center bg-background-brand text-text-on-brand", s.mark)}
      >
        <Icon name="car" size={s.icon} className={size === "lg" ? "size-[28px]" : undefined} />
      </span>
      <span className="flex flex-col gap-[2px]">
        <Word className={cn(s.word, "text-text-default")}>
          구로 <span className="text-text-brand">맛길</span>
        </Word>
        {tagline && <span className="label-md text-text-tertiary">{tagline}</span>}
      </span>
    </span>
  );
}
