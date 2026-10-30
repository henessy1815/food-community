"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/foundations/Icon";
import { MOBILE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { BottomSheet } from "./BottomSheet";
import {
  FieldLabel,
  HelperText,
  fieldBoxSize,
  fieldBoxState,
  fieldIconSize,
  type FieldSize,
} from "./Field";
import { SelectItem } from "./SelectItem";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: FieldSize;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  disabled?: boolean;
  /** auto: 모바일 바텀시트 · 데스크톱 드롭다운 */
  presentation?: "auto" | "dropdown" | "sheet";
  /** 문서/스토리용: 포커스 상태를 강제로 표시 */
  focused?: boolean;
  className?: string;
  id?: string;
}

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  size = "md",
  label,
  placeholder = "선택해주세요",
  helperText,
  errorMessage,
  disabled,
  presentation = "auto",
  focused,
  className,
  id,
}: SelectProps) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const listId = `${triggerId}-list`;
  const labelId = `${triggerId}-label`;
  const helperId = `${triggerId}-helper`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const asSheet = presentation === "sheet" || (presentation === "auto" && isMobile);

  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const selected = options.find((o) => o.value === current);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  // 드롭다운: 바깥 클릭 시 닫힘
  useEffect(() => {
    if (!open || asSheet) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, asSheet]);

  const openPanel = () => {
    setHighlight(Math.max(0, options.findIndex((o) => o.value === current)));
    setOpen(true);
  };

  const choose = (option: SelectOption) => {
    if (option.disabled) return;
    setInner(option.value);
    onValueChange?.(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const move = (delta: number) => {
    if (!options.length) return;
    let next = highlight;
    for (let i = 0; i < options.length; i++) {
      next = (next + delta + options.length) % options.length;
      if (!options[next].disabled) break;
    }
    setHighlight(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openPanel();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[highlight]) choose(options[highlight]);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  };

  const items = options.map((option, i) => (
    <SelectItem
      key={option.value}
      id={`${listId}-${i}`}
      size={size}
      selected={option.value === current}
      disabled={option.disabled}
      highlighted={!asSheet && i === highlight}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => choose(option)}
    >
      {option.label}
    </SelectItem>
  ));

  return (
    <div ref={rootRef} className={cn("relative flex w-full flex-col gap-[6px]", className)}>
      {label && (
        <FieldLabel id={labelId} htmlFor={triggerId} disabled={disabled}>
          {label}
        </FieldLabel>
      )}
      <div className="relative w-full">
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && !asSheet && highlight >= 0 ? `${listId}-${highlight}` : undefined}
          aria-labelledby={label ? `${labelId} ${triggerId}` : undefined}
          aria-invalid={Boolean(errorMessage) || undefined}
          aria-describedby={helperText || errorMessage ? helperId : undefined}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openPanel())}
          onKeyDown={onKeyDown}
          className={cn(
            "flex w-full items-center text-left transition-[border-color,box-shadow] outline-none",
            fieldBoxSize[size],
            fieldBoxState({ disabled, error: Boolean(errorMessage), focused: focused || open }),
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate body-lg",
              disabled ? "text-text-disabled" : selected ? "text-text-default" : "text-text-placeholder",
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          <Icon
            name="chevron-down"
            size={fieldIconSize[size]}
            className={cn(
              "transition-transform",
              disabled ? "text-text-disabled" : "text-text-secondary",
              open && "rotate-180",
            )}
          />
        </button>
        {!asSheet && open && (
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
            className="absolute top-[calc(100%+4px)] z-40 flex max-h-[240px] w-full flex-col overflow-y-auto rounded-[12px] border border-border-default bg-background-default p-[4px]"
          >
            {items}
          </ul>
        )}
      </div>
      <HelperText id={helperId} hint={helperText} error={errorMessage} disabled={disabled} />

      {asSheet && (
        <BottomSheet open={open} onClose={() => setOpen(false)} label={label ?? placeholder}>
          {label && <p className="heading-sm text-text-default">{label}</p>}
          <ul id={listId} role="listbox" aria-label={label ?? placeholder} className="flex flex-col">
            {items}
          </ul>
        </BottomSheet>
      )}
    </div>
  );
}
