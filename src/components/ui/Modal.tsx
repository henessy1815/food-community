"use client";

import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/foundations/Icon";
import { Button } from "./Button";
import { scrimClass, useOverlay } from "./overlay";

export interface ModalAction {
  label: string;
  onClick?: () => void;
  /** primary 자리에 destructive를 쓸 때 */
  destructive?: boolean;
  loading?: boolean;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  /** 스크림을 탭하면 닫힘 (기본 true) */
  closeOnScrim?: boolean;
  className?: string;
}

export function Modal(props: ModalProps) {
  if (!props.open || typeof document === "undefined") return null;
  return createPortal(<ModalPanel {...props} />, document.body);
}

function ModalPanel({
  open,
  onClose,
  title,
  children,
  primaryAction,
  secondaryAction,
  closeOnScrim = true,
  className,
}: ModalProps) {
  const titleId = useId();
  const bodyId = useId();
  const panelRef = useOverlay(open, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[20px]">
      <div
        data-testid="modal-scrim"
        aria-hidden
        className={scrimClass}
        onClick={closeOnScrim ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children ? bodyId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex w-full max-w-[320px] flex-col overflow-hidden rounded-[16px] bg-background-default outline-none",
          className,
        )}
      >
        <div className="flex items-center gap-[12px] px-[20px] pt-[20px] pb-[8px]">
          <h2 id={titleId} className="min-w-0 flex-1 heading-sm text-text-default">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="inline-flex size-[24px] shrink-0 cursor-pointer items-center justify-center rounded-full text-text-secondary focus-visible:outline-2 focus-visible:outline-border-brand"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        {children && (
          <div id={bodyId} className="px-[20px] body-md text-text-secondary">
            {children}
          </div>
        )}
        {(primaryAction || secondaryAction) && (
          <div className="flex gap-[8px] p-[20px]">
            {secondaryAction && (
              <Button variant="secondary" fullWidth className="flex-1" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                variant={primaryAction.destructive ? "destructive" : "primary"}
                fullWidth
                className="flex-1"
                loading={primaryAction.loading}
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
