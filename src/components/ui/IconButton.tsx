import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/foundations/Icon";

export type IconButtonVariant = "ghost" | "circle-brand" | "circle-neutral";
export type IconButtonSize = "md" | "sm";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: IconName;
  /** 스크린리더용 이름 (필수) */
  label: string;
  variant?: IconButtonVariant;
  /** md: 48×48 · 아이콘 24 / sm: 24×24 · 아이콘 16 (circle-neutral 전용, 파일 삭제 등) */
  size?: IconButtonSize;
}

const variantClass: Record<IconButtonVariant, string> = {
  ghost: "text-text-default active:bg-background-muted",
  "circle-brand": "rounded-full bg-background-brand text-text-on-brand active:bg-background-brand-pressed",
  "circle-neutral": "rounded-full bg-background-muted text-text-default active:bg-background-strong",
};

export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-brand",
        "disabled:cursor-not-allowed disabled:text-text-disabled",
        size === "md" ? "size-[48px]" : "size-[24px]",
        variant === "ghost" && "rounded-full",
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size === "md" ? 24 : 16} />
    </button>
  );
}
