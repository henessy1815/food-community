"use client";

import { useId, useState, type ChangeEvent, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { FieldLabel, HelperText, fieldBoxState } from "./Field";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  /** 에러 메시지 — 있으면 에러 상태이며 힌트를 대체 */
  errorMessage?: string;
  /** 하단 우측 글자수 카운터 (maxLength와 함께 사용) */
  showCounter?: boolean;
  /** 문서/스토리용: 포커스 상태를 강제로 표시 */
  focused?: boolean;
}

export function Textarea({
  label,
  helperText,
  errorMessage,
  showCounter = false,
  focused,
  disabled,
  maxLength,
  className,
  id,
  value,
  defaultValue,
  onChange,
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helperId = `${inputId}-helper`;
  const [innerLength, setInnerLength] = useState(String(defaultValue ?? "").length);
  const length = value !== undefined ? String(value).length : innerLength;
  const isError = Boolean(errorMessage);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInnerLength(e.target.value.length);
    onChange?.(e);
  };

  const counter = showCounter && (
    <span
      aria-live="polite"
      className={cn(
        "shrink-0 label-md",
        disabled ? "text-text-disabled" : isError ? "text-text-error" : "text-text-tertiary",
      )}
    >
      {length.toLocaleString()}
      {maxLength !== undefined && ` / ${maxLength.toLocaleString()}`}
    </span>
  );

  return (
    <div className={cn("flex w-full flex-col gap-[6px]", className)}>
      {label && (
        <FieldLabel htmlFor={inputId} disabled={disabled}>
          {label}
        </FieldLabel>
      )}
      <div
        className={cn(
          "flex w-full rounded-[12px] transition-[border-color,box-shadow]",
          fieldBoxState({ disabled, error: isError, focused }),
        )}
      >
        {/* 고정 높이 3줄(body-lg 22.4px × 3 + 상하 패딩 12px) — 초과 시 스크롤 */}
        <textarea
          id={inputId}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={isError || undefined}
          aria-describedby={helperText || errorMessage ? helperId : undefined}
          className={cn(
            "h-[90px] w-full resize-none overflow-y-auto bg-transparent px-[14px] py-[12px] body-lg text-text-default outline-none",
            "placeholder:text-text-placeholder disabled:cursor-not-allowed disabled:text-text-disabled disabled:placeholder:text-text-disabled",
          )}
          {...rest}
        />
      </div>
      <HelperText
        id={helperId}
        hint={helperText}
        error={errorMessage}
        disabled={disabled}
        trailing={counter}
      />
    </div>
  );
}
