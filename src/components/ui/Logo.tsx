import Image from "next/image";
import { cn } from "@/lib/cn";

const sizeClass = {
  md: {
    mark: "size-[32px]",
    px: 32,
    word: "heading-sm",
  },
  lg: {
    mark: "size-[56px] shadow-[0_6px_16px_var(--color-shadow-brand)]",
    px: 56,
    word: "heading-md",
  },
  xl: {
    mark: "size-[72px] ring-4 ring-text-inverse/15 shadow-[0_12px_32px_var(--color-shadow-brand)]",
    px: 72,
    word: "display-md",
  },
} as const;

/**
 * 구로 맛길 로고 — 원형 스탬프 브랜드 마크(logo.png, 투명 배경) + "구로 맛길" 워드마크("맛길"만 브랜드 컬러)
 * - md: 상단 내비게이션 / lg: 가로 대형 / xl: 로그인 화면(세로 락업 + 영문 레터링)
 * - tone="inverse": 사진·어두운 배경 위 (워드마크 흰색)
 * - 워드마크는 텍스트라 스크린리더에 "구로 맛길"로 읽힌다
 */
export function Logo({
  size = "md",
  tone = "default",
  tagline,
  as: Word = "span",
  className,
}: {
  size?: keyof typeof sizeClass;
  tone?: "default" | "inverse";
  /** 워드마크 아래 보조 문구 (주말 맛집 드라이브) */
  tagline?: string;
  /** 워드마크 요소 — 페이지 제목이면 h1 */
  as?: "span" | "h1";
  className?: string;
}) {
  const s = sizeClass[size];
  const stacked = size === "xl";
  const inverse = tone === "inverse";
  return (
    <span
      className={cn(
        "inline-flex items-center",
        stacked ? "flex-col gap-(--spacing-20)" : size === "lg" ? "gap-(--spacing-12)" : "gap-(--spacing-8)",
        className,
      )}
    >
      {/* 마크 이미지는 scripts/generate-pwa-assets.mjs 가 logo.png에서 생성 */}
      <Image
        src="/images/logo-mark.png"
        alt=""
        width={s.px}
        height={s.px}
        priority={size === "xl"}
        className={cn("shrink-0 rounded-full", s.mark)}
      />
      <span className={cn("flex flex-col gap-[2px]", stacked && "items-center gap-(--spacing-8)")}>
        <Word className={cn(s.word, stacked && "tracking-tight", inverse && "drop-shadow-lg", inverse ? "text-text-inverse" : "text-text-default")}>
          구로 <span className="text-text-brand">맛길</span>
        </Word>
        {stacked && (
          <span
            aria-hidden
            className={cn(
              "flex items-center gap-(--spacing-8) label-md tracking-widest",
              inverse ? "text-text-inverse/70" : "text-text-tertiary",
            )}
          >
            <span className="h-px w-(--spacing-16) bg-current" />
            GURO MATGIL
            <span className="h-px w-(--spacing-16) bg-current" />
          </span>
        )}
        {tagline && (
          <span className={cn("label-md", inverse ? "text-text-inverse/70" : "text-text-tertiary")}>{tagline}</span>
        )}
      </span>
    </span>
  );
}
