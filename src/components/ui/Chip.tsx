import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/foundations/Icon";

export type ChipSize = "sm" | "md";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  size?: ChipSize;
  /** 좌측 아이콘 (16px) — 있으면 좌우 패딩이 줄어듦 */
  icon?: IconName;
}

const padding = {
  sm: { plain: "px-[12px]", icon: "px-[6px]" },
  md: { plain: "px-[16px]", icon: "px-[8px]" },
};

export function Chip({
  selected = false,
  size = "md",
  icon,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ChipProps) {
  const state = disabled
    ? selected
      ? "bg-background-strong text-text-inverse"
      : "border border-border-disabled bg-background-disabled text-text-disabled"
    : selected
      ? "bg-background-brand text-text-on-brand"
      : "border border-border-strong bg-background-default text-text-default";

  return (
    <button
      type={type}
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-[4px] rounded-full text-center whitespace-nowrap label-lg transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-brand",
        size === "sm" ? "h-[24px]" : "h-[32px]",
        padding[size][icon ? "icon" : "plain"],
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        state,
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}
