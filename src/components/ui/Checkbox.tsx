"use client";

import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { HelperText } from "./Field";

export type ControlSize = "sm" | "md";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label?: ReactNode;
  size?: ControlSize;
  indeterminate?: boolean;
  /** 에러 상태 — 메시지는 단독 사용 시 errorMessage, 그룹은 CheckboxGroup에서 1번만 표시 */
  error?: boolean;
  errorMessage?: string;
}

const boxSize = { sm: "size-[16px] rounded-[4px]", md: "size-[20px] rounded-[5px]" };
const barSize = { sm: "w-[8px]", md: "w-[10px]" };

export function Checkbox({
  label,
  size = "sm",
  indeterminate = false,
  error = false,
  errorMessage,
  disabled,
  className,
  id,
  ...rest
}: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const ref = useRef<HTMLInputElement>(null);
  const isError = (error || Boolean(errorMessage)) && !disabled;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  // 체크 영역: 아이코노그래피 아이콘이 아닌 전용 마크 (디자인 Check Mark path)
  const filled = disabled
    ? "peer-checked:border-transparent peer-checked:bg-background-strong peer-indeterminate:border-transparent peer-indeterminate:bg-background-strong"
    : isError
      ? "peer-checked:border-transparent peer-checked:bg-background-error peer-indeterminate:border-transparent peer-indeterminate:bg-background-error"
      : "peer-checked:border-transparent peer-checked:bg-background-brand peer-indeterminate:border-transparent peer-indeterminate:bg-background-brand";
  const markColor = disabled || isError ? "text-text-inverse" : "text-text-on-brand";

  return (
    <div className={cn("flex flex-col gap-[6px]", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex w-fit items-center gap-[8px]",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <span className="relative inline-flex shrink-0">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            disabled={disabled}
            aria-invalid={isError || undefined}
            className="peer absolute inset-0 m-0 cursor-[inherit] opacity-0"
            {...rest}
          />
          <span
            aria-hidden
            className={cn(
              "flex items-center justify-center border-[1.5px] transition-colors",
              "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-border-brand",
              boxSize[size],
              disabled
                ? "border-border-disabled bg-background-disabled"
                : isError
                  ? "border-border-error bg-background-default"
                  : "border-border-strong bg-background-default",
              filled,
              "[&>svg]:hidden peer-checked:[&>.check]:block peer-indeterminate:[&>.check]:hidden peer-indeterminate:[&>.bar]:block",
            )}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className={cn("check size-full", markColor)}
              stroke="currentColor"
              strokeWidth={size === "sm" ? 1.8 : 1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 8.4l2.8 2.8 5.2-5.8" />
            </svg>
            <svg viewBox="0 0 16 16" className={cn("bar", barSize[size], markColor)} fill="currentColor">
              <rect x="0" y="7" width="16" height="2" rx="1" />
            </svg>
          </span>
        </span>
        {label && (
          <span className={cn("body-md", disabled ? "text-text-disabled" : "text-text-default")}>
            {label}
          </span>
        )}
      </label>
      {errorMessage && <HelperText error={errorMessage} disabled={disabled} />}
    </div>
  );
}

export interface CheckboxGroupProps {
  legend?: string;
  /** 그룹(폼) 아래에 1번만 표시 */
  errorMessage?: string;
  helperText?: string;
  direction?: "vertical" | "horizontal";
  children: ReactNode;
  className?: string;
}

export function CheckboxGroup({
  legend,
  errorMessage,
  helperText,
  direction = "vertical",
  children,
  className,
}: CheckboxGroupProps) {
  return (
    <fieldset className={cn("flex flex-col gap-[8px]", className)} aria-invalid={Boolean(errorMessage) || undefined}>
      {legend && <legend className="mb-[8px] label-lg text-text-default">{legend}</legend>}
      <div className={cn("flex gap-[12px]", direction === "vertical" ? "flex-col" : "flex-row flex-wrap")}>
        {children}
      </div>
      <HelperText hint={helperText} error={errorMessage} />
    </fieldset>
  );
}
