"use client";

import { createContext, useContext, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { HelperText } from "./Field";
import type { ControlSize } from "./Checkbox";

interface RadioGroupContextValue {
  name: string;
  value: string | undefined;
  size: ControlSize;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps {
  legend?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: ControlSize;
  disabled?: boolean;
  direction?: "vertical" | "horizontal";
  helperText?: string;
  errorMessage?: string;
  children: ReactNode;
  className?: string;
}

/** 라디오는 단독 사용 금지 — 반드시 RadioGroup 안에서 사용 */
export function RadioGroup({
  legend,
  name,
  value,
  defaultValue,
  onValueChange,
  size = "sm",
  disabled,
  direction = "vertical",
  helperText,
  errorMessage,
  children,
  className,
}: RadioGroupProps) {
  const autoName = useId();
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;

  return (
    <RadioGroupContext.Provider
      value={{
        name: name ?? autoName,
        value: current,
        size,
        disabled,
        onChange: (v) => {
          setInner(v);
          onValueChange?.(v);
        },
      }}
    >
      <fieldset role="radiogroup" className={cn("flex flex-col gap-[8px]", className)}>
        {legend && <legend className="mb-[8px] label-lg text-text-default">{legend}</legend>}
        <div className={cn("flex gap-[12px]", direction === "vertical" ? "flex-col" : "flex-row flex-wrap")}>
          {children}
        </div>
        <HelperText hint={helperText} error={errorMessage} disabled={disabled} />
      </fieldset>
    </RadioGroupContext.Provider>
  );
}

const areaSize = { sm: "size-[16px]", md: "size-[20px]" };
const dotSize = { sm: "size-[6px]", md: "size-[8px]" };

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type" | "name" | "checked" | "onChange"> {
  value: string;
  label: ReactNode;
}

export function Radio({ value, label, disabled: ownDisabled, className, id, ...rest }: RadioProps) {
  const group = useContext(RadioGroupContext);
  const autoId = useId();
  if (!group) throw new Error("Radio는 RadioGroup 안에서만 사용할 수 있어요.");
  const inputId = id ?? autoId;
  const disabled = group.disabled || ownDisabled;
  const { size } = group;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "inline-flex w-fit items-center gap-[8px]",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
    >
      <span className="relative inline-flex shrink-0">
        <input
          id={inputId}
          type="radio"
          name={group.name}
          value={value}
          checked={group.value === value}
          disabled={disabled}
          onChange={() => group.onChange(value)}
          className="peer absolute inset-0 m-0 cursor-[inherit] opacity-0"
          {...rest}
        />
        <span
          aria-hidden
          className={cn(
            "flex items-center justify-center rounded-full border-[1.5px] transition-colors",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-border-brand",
            "[&>span]:hidden peer-checked:[&>span]:block peer-checked:border-transparent",
            areaSize[size],
            disabled
              ? "border-border-disabled bg-background-disabled peer-checked:bg-background-strong"
              : "border-border-strong bg-background-default peer-checked:bg-background-brand",
          )}
        >
          <span
            className={cn(
              "rounded-full",
              dotSize[size],
              disabled ? "bg-text-inverse" : "bg-text-on-brand",
            )}
          />
        </span>
      </span>
      <span className={cn("body-md", disabled ? "text-text-disabled" : "text-text-default")}>{label}</span>
    </label>
  );
}
