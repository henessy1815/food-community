"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { scrimClass, useOverlay } from "./overlay";

export interface BottomSheetProps {
  open: boolean;
  /** 스크림 탭 · 아래로 드래그 · Escape 시 선택 없이 닫힘 */
  onClose: () => void;
  /** 스크린리더용 시트 이름 */
  label: string;
  children: ReactNode;
  className?: string;
}

const DRAG_CLOSE_THRESHOLD = 80;

export function BottomSheet(props: BottomSheetProps) {
  if (!props.open || typeof document === "undefined") return null;
  return createPortal(<SheetPanel {...props} />, document.body);
}

function SheetPanel({ open, onClose, label, children, className }: BottomSheetProps) {
  const panelRef = useOverlay(open, onClose);
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    startY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    setDragY(Math.max(0, e.clientY - startY.current));
  };
  const onPointerUp = () => {
    if (dragY > DRAG_CLOSE_THRESHOLD) onClose();
    startY.current = null;
    setDragY(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div data-testid="sheet-scrim" aria-hidden className={scrimClass} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
        className={cn(
          "relative flex max-h-[90vh] w-full flex-col rounded-t-[20px] bg-background-default pt-[8px] outline-none",
          !dragY && "transition-transform",
          className,
        )}
      >
        <div
          className="flex h-[20px] w-full shrink-0 cursor-grab touch-none items-center justify-center"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span aria-hidden className="h-[4px] w-[36px] rounded-[2px] bg-border-strong" />
        </div>
        <div className="flex flex-col gap-[8px] overflow-y-auto px-(--spacing-16) pt-[8px] pb-(--spacing-24)">
          {children}
        </div>
      </div>
    </div>
  );
}
