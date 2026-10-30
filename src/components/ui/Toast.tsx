import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/foundations/Icon";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  type?: ToastType;
  children: ReactNode;
  /** 지정하면 우측에 닫기 아이콘 노출 */
  onClose?: () => void;
  className?: string;
}

const statusIcon: Record<ToastType, { icon: IconName; color: string }> = {
  success: { icon: "check-circle", color: "text-text-success" },
  error: { icon: "error", color: "text-text-error" },
  info: { icon: "info", color: "text-text-info" },
  warning: { icon: "warning", color: "text-text-warning" },
};

/** 모바일: 화면 너비 - 좌우 마진(부모 폭) · 데스크톱: 400px */
export function Toast({ type = "info", children, onClose, className }: ToastProps) {
  const { icon, color } = statusIcon[type];
  return (
    <div
      role={type === "error" || type === "warning" ? "alert" : "status"}
      className={cn(
        "flex w-full items-start gap-[10px] rounded-[12px] bg-background-inverse px-[16px] py-[14px] md:w-[400px]",
        className,
      )}
    >
      <Icon name={icon} size={20} className={color} />
      <p className="min-w-0 flex-1 body-md text-text-inverse">{children}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="inline-flex shrink-0 cursor-pointer text-text-tertiary"
        >
          <Icon name="close" size={20} />
        </button>
      )}
    </div>
  );
}
