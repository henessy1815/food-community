"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TabNavigationProps {
  /** 2개 이상 균등 분배 */
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  className?: string;
}

export function TabNavigation({
  items,
  value,
  defaultValue,
  onValueChange,
  label = "탭",
  className,
}: TabNavigationProps) {
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const current = value ?? inner;
  const listRef = useRef<HTMLDivElement>(null);

  const select = (v: string) => {
    setInner(v);
    onValueChange?.(v);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const enabled = items.filter((i) => !i.disabled);
    const index = enabled.findIndex((i) => i.value === current);
    const next = enabled[(index + (e.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length];
    select(next.value);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("flex h-[48px] w-full border-b border-border-default bg-background-default", className)}
    >
      {items.map((item) => {
        const active = item.value === current;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            data-value={item.value}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => select(item.value)}
            className={cn(
              "relative flex h-full flex-1 cursor-pointer items-center justify-center label-lg",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-brand",
              "disabled:cursor-not-allowed disabled:text-text-disabled",
              active ? "text-text-default" : "text-text-secondary",
            )}
          >
            {item.label}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-[-1px] h-[2px] bg-background-brand transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
