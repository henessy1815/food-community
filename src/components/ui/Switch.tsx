"use client";

import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ControlSize } from "./Checkbox";

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  label?: ReactNode;
  size?: ControlSize;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const trackSize = { sm: "h-[16px] w-[32px]", md: "h-[20px] w-[40px]" };
const knobSize = { sm: "size-[12px]", md: "size-[16px]" };
const knobOn = { sm: "translate-x-[16px]", md: "translate-x-[20px]" };

/** 스위치(토글) — 단독 사용 전용 */
export function Switch({
  label,
  size = "sm",
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  className,
  id,
  ...rest
}: SwitchProps) {
  const autoId = useId();
  const buttonId = id ?? autoId;
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;

  const track = disabled
    ? on
      ? "bg-background-strong"
      : "bg-background-disabled"
    : on
      ? "bg-background-brand"
      : "bg-background-strong";

  return (
    <span className={cn("inline-flex items-center gap-[8px]", className)}>
      <button
        id={buttonId}
        type="button"
        role="switch"
        aria-checked={on}
        disabled={disabled}
        onClick={() => {
          setInner(!on);
          onCheckedChange?.(!on);
        }}
        className={cn(
          "inline-flex shrink-0 items-center rounded-full p-[2px] transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-brand",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
          trackSize[size],
          track,
        )}
        {...rest}
      >
        <span
          aria-hidden
          className={cn(
            "rounded-full bg-background-default transition-transform",
            knobSize[size],
            on && knobOn[size],
          )}
        />
      </button>
      {label && (
        <label
          htmlFor={buttonId}
          className={cn(
            "body-md",
            disabled ? "cursor-not-allowed text-text-disabled" : "cursor-pointer text-text-default",
          )}
        >
          {label}
        </label>
      )}
    </span>
  );
}
