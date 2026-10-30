import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/foundations/Icon";

export type ButtonVariant = "primary" | "secondary" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: IconName;
  iconRight?: IconName;
  /** 좌측 아이콘을 스피너로 대체, 레이블 유지 */
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-[32px] gap-[4px] rounded-[8px] px-[12px]",
  md: "h-[40px] gap-[6px] rounded-[10px] px-[16px]",
  lg: "h-[48px] gap-[8px] rounded-[12px] px-[20px]",
};

const iconSize = { sm: 16, md: 20, lg: 20 } as const;

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-background-brand text-text-on-brand active:bg-background-brand-pressed",
  secondary:
    "border border-border-strong bg-background-default text-text-default active:bg-background-muted",
  destructive: "bg-background-error text-text-inverse active:brightness-95",
};

const disabledClass: Record<ButtonVariant, string> = {
  primary: "bg-background-disabled text-text-disabled",
  secondary: "border border-border-disabled bg-background-disabled text-text-disabled",
  destructive: "bg-background-disabled text-text-disabled",
};

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const s = iconSize[size];
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap label-lg transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-brand",
        sizeClass[size],
        disabled ? disabledClass[variant] : variantClass[variant],
        disabled ? "cursor-not-allowed" : loading ? "cursor-progress" : "cursor-pointer",
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Icon name="loader" size={s} className="animate-spin" />
      ) : (
        iconLeft && <Icon name={iconLeft} size={s} />
      )}
      {children}
      {iconRight && <Icon name={iconRight} size={s} />}
    </button>
  );
}
