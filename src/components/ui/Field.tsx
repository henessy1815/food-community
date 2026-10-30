import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/foundations/Icon";

export type FieldSize = "sm" | "md" | "lg";

/** 입력 박스 사이즈 — TextField · Select 공용 */
export const fieldBoxSize: Record<FieldSize, string> = {
  sm: "h-[32px] gap-[6px] rounded-[8px] px-[10px]",
  md: "h-[40px] gap-[8px] rounded-[10px] px-[12px]",
  lg: "h-[48px] gap-[8px] rounded-[12px] px-[14px]",
};

export const fieldIconSize = { sm: 16, md: 20, lg: 20 } as const;

/**
 * 입력 박스 상태 스타일 — 디자인의 1px(default) / 1.5px(focused·error) 스트로크를
 * 레이아웃이 흔들리지 않도록 border 1px + inset shadow 0.5px로 표현
 */
export function fieldBoxState({
  disabled,
  error,
  focused,
}: {
  disabled?: boolean;
  error?: boolean;
  focused?: boolean;
}) {
  if (disabled) return "border border-border-disabled bg-background-disabled text-text-disabled";
  if (error)
    return "border border-border-error bg-background-default shadow-[inset_0_0_0_0.5px_var(--color-border-error)]";
  return cn(
    "border bg-background-default",
    focused
      ? "border-border-brand shadow-[inset_0_0_0_0.5px_var(--color-border-brand)]"
      : "border-border-strong focus-within:border-border-brand focus-within:shadow-[inset_0_0_0_0.5px_var(--color-border-brand)]",
  );
}

export function FieldLabel({
  htmlFor,
  id,
  disabled,
  children,
}: {
  htmlFor?: string;
  id?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      id={id}
      className={cn("label-lg", disabled ? "text-text-disabled" : "text-text-default")}
    >
      {children}
    </label>
  );
}

/** 하단 헬퍼텍스트 — 에러 시 힌트를 대체 */
export function HelperText({
  id,
  hint,
  error,
  disabled,
  trailing,
}: {
  id?: string;
  hint?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  trailing?: ReactNode;
}) {
  if (!hint && !error && !trailing) return null;
  const isError = Boolean(error) && !disabled;
  return (
    <div className="flex w-full items-center gap-[4px]">
      {isError && <Icon name="error" size={16} className="text-text-error" />}
      <p
        id={id}
        role={isError ? "alert" : undefined}
        className={cn(
          "min-w-0 flex-1 label-md",
          disabled ? "text-text-disabled" : isError ? "text-text-error" : "text-text-tertiary",
        )}
      >
        {isError ? error : hint}
      </p>
      {trailing}
    </div>
  );
}
