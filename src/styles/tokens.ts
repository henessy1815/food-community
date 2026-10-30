/*
 * Design Token 메타데이터 — Storybook 문서/검증용
 * 실제 스타일 값의 기준은 tokens.css. 스토리 테스트가 두 파일이 어긋나지 않는지 검증한다.
 */

export const colorScales = ["brand", "neutral", "amber", "green", "blue", "red"] as const;
export type ColorScale = (typeof colorScales)[number];

export const colorSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export const colorScaleMeta: Record<ColorScale, { label: string; role: string }> = {
  brand: { label: "Brand", role: "브랜드 · 주요 액션" },
  neutral: { label: "Neutral", role: "텍스트 · 배경 · 보더" },
  amber: { label: "Amber", role: "경고 (Warning)" },
  green: { label: "Green", role: "성공 (Success)" },
  blue: { label: "Blue", role: "정보 (Info)" },
  red: { label: "Red", role: "에러 (Error)" },
};

export const primitiveColors: Record<ColorScale, Record<(typeof colorSteps)[number], string>> = {
  brand: { 50: "#FFF1EC", 100: "#FFE7E2", 200: "#FECEC4", 300: "#FEAC9B", 400: "#FE8167", 500: "#FF5A36", 600: "#E8431F", 700: "#B22E01", 800: "#892402", 900: "#671B01", 950: "#400E00" },
  neutral: { 50: "#FFFFFF", 100: "#F5F5F3", 200: "#ECECEA", 300: "#DADAD7", 400: "#A6A6A6", 500: "#878785", 600: "#6B6B6B", 700: "#4F4F4E", 800: "#333333", 900: "#1F1F1F", 950: "#191919" },
  amber: { 50: "#FCF6EB", 100: "#FAEBD2", 200: "#F5D6A8", 300: "#EFBA6E", 400: "#E29A2B", 500: "#CA8106", 600: "#AD6A00", 700: "#8F5504", 800: "#703F03", 900: "#562D01", 950: "#361900" },
  green: { 50: "#F1F9F3", 100: "#DFF3E5", 200: "#BFE6CC", 300: "#95D5AE", 400: "#68C08F", 500: "#2E9E6A", 600: "#189260", 700: "#03784E", 800: "#015C3C", 900: "#02452D", 950: "#01291A" },
  blue: { 50: "#F2F7FE", 100: "#E2EEFF", 200: "#C5DDFE", 300: "#A0C6FE", 400: "#74ACFE", 500: "#4891FE", 600: "#2D77E6", 700: "#1E5FC3", 800: "#154899", 900: "#113673", 950: "#051F4B" },
  red: { 50: "#FFF8F8", 100: "#FDECEC", 200: "#FECDC8", 300: "#FFABA2", 400: "#FF7F74", 500: "#FA4E47", 600: "#E53935", 700: "#B91A19", 800: "#920E0D", 900: "#6D0D09", 950: "#460101" },
};

/** 시맨틱 토큰 → 참조하는 프리미티브 토큰 */
export const semanticColors = {
  text: {
    "color-text-default": "color-neutral-950",
    "color-text-body": "color-neutral-800",
    "color-text-secondary": "color-neutral-600",
    "color-text-tertiary": "color-neutral-400",
    "color-text-placeholder": "color-neutral-400",
    "color-text-disabled": "color-neutral-400",
    "color-text-inverse": "color-neutral-50",
    "color-text-brand": "color-brand-500",
    "color-text-brand-strong": "color-brand-600",
    "color-text-on-brand": "color-neutral-50",
    "color-text-error": "color-red-600",
    "color-text-error-strong": "color-red-700",
    "color-text-success": "color-green-500",
    "color-text-warning": "color-amber-600",
    "color-text-info": "color-blue-600",
  },
  background: {
    "color-background-default": "color-neutral-50",
    "color-background-subtle": "color-neutral-100",
    "color-background-muted": "color-neutral-200",
    "color-background-strong": "color-neutral-300",
    "color-background-disabled": "color-neutral-200",
    "color-background-inverse": "color-neutral-900",
    "color-background-overlay": "color-neutral-950",
    "color-background-brand": "color-brand-500",
    "color-background-brand-pressed": "color-brand-600",
    "color-background-brand-subtle": "color-brand-50",
    "color-background-brand-muted": "color-brand-100",
    "color-background-error": "color-red-600",
    "color-background-error-subtle": "color-red-50",
    "color-background-error-muted": "color-red-100",
    "color-background-success": "color-green-500",
    "color-background-success-subtle": "color-green-50",
    "color-background-warning": "color-amber-500",
    "color-background-warning-subtle": "color-amber-50",
    "color-background-info": "color-blue-600",
    "color-background-info-subtle": "color-blue-50",
  },
  border: {
    "color-border-default": "color-neutral-200",
    "color-border-strong": "color-neutral-300",
    "color-border-disabled": "color-neutral-200",
    "color-border-brand": "color-brand-500",
    "color-border-error": "color-red-600",
    "color-border-success": "color-green-500",
    "color-border-warning": "color-amber-600",
    "color-border-info": "color-blue-600",
  },
  shadow: {
    "color-shadow-brand": "color-brand-300",
  },
} as const;

export const typographyPrimitives = {
  "font-family": "Pretendard Variable",
  fontSize: {
    "font-size-900": 40,
    "font-size-800": 36,
    "font-size-700": 32,
    "font-size-600": 28,
    "font-size-500": 24,
    "font-size-400": 20,
    "font-size-300": 16,
    "font-size-200": 14,
    "font-size-100": 12,
  },
  fontWeight: {
    "font-weight-bold": 700,
    "font-weight-semibold": 600,
    "font-weight-regular": 400,
  },
  lineHeight: {
    "font-line-height-tight": 1.2,
    "font-line-height-normal": 1.4,
  },
  letterSpacing: "-2%",
} as const;

export const textStyles = {
  "display-lg": { size: "font-size-800", weight: "font-weight-bold", lineHeight: "font-line-height-tight" },
  "display-md": { size: "font-size-700", weight: "font-weight-bold", lineHeight: "font-line-height-tight" },
  "display-sm": { size: "font-size-600", weight: "font-weight-bold", lineHeight: "font-line-height-tight" },
  "heading-lg": { size: "font-size-500", weight: "font-weight-bold", lineHeight: "font-line-height-tight" },
  "heading-md": { size: "font-size-400", weight: "font-weight-bold", lineHeight: "font-line-height-tight" },
  "heading-sm": { size: "font-size-300", weight: "font-weight-semibold", lineHeight: "font-line-height-tight" },
  "body-lg": { size: "font-size-300", weight: "font-weight-regular", lineHeight: "font-line-height-normal" },
  "body-md": { size: "font-size-200", weight: "font-weight-regular", lineHeight: "font-line-height-normal" },
  "label-lg": { size: "font-size-200", weight: "font-weight-semibold", lineHeight: "font-line-height-normal" },
  "label-md": { size: "font-size-100", weight: "font-weight-regular", lineHeight: "font-line-height-normal" },
} as const;

export const spacingTokens = {
  "spacing-8": 8,
  "spacing-12": 12,
  "spacing-16": 16,
  "spacing-20": 20,
  "spacing-24": 24,
  "spacing-32": 32,
} as const;

/** WCAG 대비율 계산 (팔레트 문서에 neutral-50 대비 표시용) */
export function contrastRatio(hexA: string, hexB: string) {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [l1, l2] = [lum(hexA), lum(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function hexToRgb(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
