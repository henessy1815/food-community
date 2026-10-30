"use client";

import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { MOBILE_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { BottomSheet } from "./BottomSheet";
import { MenuContext } from "./menu-context";
import type { MenuItemSize } from "./MenuItem";

type TriggerProps = {
  onClick?: () => void;
  "aria-haspopup"?: "menu";
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
};

export interface MenuProps {
  /** 메뉴를 여는 버튼 (IconButton · Button 등) */
  trigger: ReactElement<TriggerProps>;
  /** MenuItem 목록 */
  children: ReactNode;
  /** 메뉴아이템 사이즈 */
  size?: MenuItemSize;
  /** 드롭다운 정렬 */
  align?: "start" | "end";
  /** auto: 모바일 바텀시트 · 데스크톱 메뉴버튼 아래 */
  presentation?: "auto" | "dropdown" | "sheet";
  label?: string;
  defaultOpen?: boolean;
  className?: string;
}

export function Menu({
  trigger,
  children,
  size = "md",
  align = "end",
  presentation = "auto",
  label = "메뉴",
  defaultOpen = false,
  className,
}: MenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const asSheet = presentation === "sheet" || (presentation === "auto" && isMobile);

  useEffect(() => {
    if (!open || asSheet) return;
    listRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, asSheet]);

  const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [
      ...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'),
    ];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = (index + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  };

  const close = () => setOpen(false);
  const list = (
    <MenuContext.Provider value={{ size, close }}>
      <div
        ref={listRef}
        id={menuId}
        role="menu"
        aria-label={label}
        onKeyDown={onListKeyDown}
        className={cn(
          "flex flex-col",
          !asSheet &&
            "absolute top-[calc(100%+4px)] z-40 w-[200px] overflow-hidden rounded-[12px] border border-border-default bg-background-default p-[4px]",
          !asSheet && (align === "end" ? "right-0" : "left-0"),
          className,
        )}
      >
        {children}
      </div>
    </MenuContext.Provider>
  );

  return (
    <div ref={rootRef} className="relative inline-flex h-fit w-fit self-start">
      {cloneElement(trigger, {
        onClick: () => setOpen((v) => !v),
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": open ? menuId : undefined,
      })}
      {asSheet ? (
        <BottomSheet open={open} onClose={close} label={label}>
          {list}
        </BottomSheet>
      ) : (
        open && list
      )}
    </div>
  );
}
