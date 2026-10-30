import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeType = "neutral" | "success" | "error" | "info" | "warning";
export type BadgeSize = "md" | "lg";

export interface BadgeProps {
  type?: BadgeType;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

const typeClass: Record<BadgeType, string> = {
  neutral: "bg-background-muted text-text-default",
  success: "bg-background-success text-text-inverse",
  error: "bg-background-error text-text-inverse",
  info: "bg-background-info text-text-inverse",
  warning: "bg-background-warning text-text-default",
};

export function Badge({ type = "neutral", size = "md", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[6px] px-[8px] text-center whitespace-nowrap label-md",
        size === "md" ? "h-[20px]" : "h-[24px]",
        typeClass[type],
        className,
      )}
    >
      {children}
    </span>
  );
}
