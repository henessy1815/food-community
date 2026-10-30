"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/foundations/Icon";

export interface BottomNavigationItem {
  value: string;
  label: string;
  /** 미선택: 아웃라인 아이콘 */
  icon: IconName;
  /** 선택: 필 아이콘 (없으면 icon 사용) */
  activeIcon?: IconName;
}

export interface BottomNavigationProps {
  /** 2~5개 균등 분배 */
  items: BottomNavigationItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 아이콘 아래 레이블 표시 */
  showLabels?: boolean;
  className?: string;
}

export function BottomNavigation({
  items,
  value,
  defaultValue,
  onValueChange,
  showLabels = true,
  className,
}: BottomNavigationProps) {
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const current = value ?? inner;

  return (
    <nav
      aria-label="하단 메뉴"
      className={cn("flex h-[56px] w-full border-t border-border-default bg-background-default", className)}
    >
      {items.slice(0, 5).map((item) => {
        const active = item.value === current;
        return (
          <button
            key={item.value}
            type="button"
            aria-current={active ? "page" : undefined}
            aria-label={showLabels ? undefined : item.label}
            onClick={() => {
              setInner(item.value);
              onValueChange?.(item.value);
            }}
            className={cn(
              "flex h-full flex-1 cursor-pointer flex-col items-center justify-center gap-[2px]",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-brand",
              active ? "text-text-brand" : "text-text-secondary",
            )}
          >
            <Icon name={active ? (item.activeIcon ?? item.icon) : item.icon} size={24} />
            {showLabels && <span className="label-md">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
