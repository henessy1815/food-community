"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/foundations/Icon";
import {
  FieldLabel,
  HelperText,
  fieldBoxSize,
  fieldBoxState,
  fieldIconSize,
  type FieldSize,
} from "./Field";

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  type?: "text" | "password";
  size?: FieldSize;
  label?: string;
  /** 힌트 텍스트 */
  helperText?: string;
  /** 에러 메시지 — 있으면 에러 상태이며 힌트를 대체 */
  errorMessage?: string;
  iconLeft?: IconName;
  iconRight?: IconName;
  /** password 타입에서 우측 보기/숨기기 토글 노출 */
  passwordToggle?: boolean;
  /** 지정하면 값이 있을 때 우측에 지우기 버튼 노출 (iconRight 대체) */
  onClear?: () => void;
  /** 문서/스토리용: 포커스 상태를 강제로 표시 */
  focused?: boolean;
  className?: string;
}

export function TextField({
  type = "text",
  size = "md",
  label,
  helperText,
  errorMessage,
  iconLeft,
  iconRight,
  passwordToggle = false,
  onClear,
  focused,
  disabled,
  className,
  id,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helperId = `${inputId}-helper`;
  const [revealed, setRevealed] = useState(false);
  const s = fieldIconSize[size];
  const iconColor = disabled ? "text-text-disabled" : "text-text-secondary";
  const hasHelper = Boolean(helperText || errorMessage);

  return (
    <div className={cn("flex w-full flex-col gap-[6px]", className)}>
      {label && (
        <FieldLabel htmlFor={inputId} disabled={disabled}>
          {label}
        </FieldLabel>
      )}
      <div
        className={cn(
          "flex w-full items-center transition-[border-color,box-shadow]",
          fieldBoxSize[size],
          fieldBoxState({ disabled, error: Boolean(errorMessage), focused }),
        )}
      >
        {iconLeft && <Icon name={iconLeft} size={s} className={iconColor} />}
        <input
          id={inputId}
          type={type === "password" && !revealed ? "password" : "text"}
          disabled={disabled}
          aria-invalid={Boolean(errorMessage) || undefined}
          aria-describedby={hasHelper ? helperId : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent body-lg outline-none",
            "placeholder:text-text-placeholder disabled:cursor-not-allowed disabled:text-text-disabled disabled:placeholder:text-text-disabled",
            "text-text-default",
          )}
          {...rest}
        />
        {type === "password" && passwordToggle ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "비밀번호 숨기기" : "비밀번호 보기"}
            aria-pressed={revealed}
            className={cn("inline-flex cursor-pointer disabled:cursor-not-allowed", iconColor)}
          >
            <Icon name={revealed ? "eye-off" : "eye"} size={s} />
          </button>
        ) : onClear ? (
          String(rest.value ?? "") !== "" && !disabled && (
            <button
              type="button"
              onClick={onClear}
              aria-label="입력 지우기"
              className={cn("inline-flex cursor-pointer", iconColor)}
            >
              <Icon name="close" size={s} />
            </button>
          )
        ) : (
          iconRight && <Icon name={iconRight} size={s} className={iconColor} />
        )}
      </div>
      <HelperText id={helperId} hint={helperText} error={errorMessage} disabled={disabled} />
    </div>
  );
}
