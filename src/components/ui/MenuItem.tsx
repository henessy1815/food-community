"use client";

import { useContext, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/foundations/Icon";
import { MenuContext } from "./menu-context";

export type MenuItemType = "default" | "destructive";
export type MenuItemSize = "sm" | "md" | "lg";

export interface MenuItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  type?: MenuItemType;
  /** 참조하는 Menu의 사이즈를 따름 (Menu 밖에서 단독 렌더 시 지정) */
  size?: MenuItemSize;
  icon?: IconName;
  /** 선택 시 실행 — 실행 후 메뉴가 닫힘 */
  onSelect?: () => void;
}

const sizeClass: Record<MenuItemSize, string> = {
  sm: "h-[32px] gap-[8px] px-[12px]",
  md: "h-[40px] gap-[10px] px-[12px]",
  lg: "h-[48px] gap-[12px] px-[16px]",
};
const iconSize = { sm: 16, md: 20, lg: 20 } as const;

export function MenuItem({
  type = "default",
  size,
  icon,
  onSelect,
  onClick,
  disabled,
  className,
  children,
  ...rest
}: MenuItemProps) {
  const menu = useContext(MenuContext);
  const s = size ?? menu?.size ?? "md";
  const destructive = type === "destructive";

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        onSelect?.();
        menu?.close();
      }}
      className={cn(
        "flex w-full shrink-0 items-center rounded-[8px] bg-background-default text-left outline-none",
        sizeClass[s],
        disabled
          ? "cursor-not-allowed text-text-disabled"
          : cn(
              "cursor-pointer hover:bg-background-muted focus-visible:bg-background-muted",
              destructive ? "text-text-error" : "text-text-default",
            ),
        className,
      )}
      {...rest}
    >
      {icon && (
        <Icon
          name={icon}
          size={iconSize[s]}
          className={disabled ? "text-text-disabled" : destructive ? "text-text-error" : "text-text-secondary"}
        />
      )}
      <span className="min-w-0 flex-1 truncate body-lg">{children}</span>
    </button>
  );
}
