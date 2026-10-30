import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { IconName } from "@/components/foundations/Icon";
import { IconButton } from "./IconButton";

export interface NavAction {
  icon: IconName;
  label: string;
  onClick?: () => void;
}

export interface TopNavigationProps {
  title?: ReactNode;
  /** 좌측 아이콘 버튼 (예: 뒤로가기) */
  leftAction?: NavAction;
  /** 우측 아이콘 버튼 (최대 2개 권장) */
  rightActions?: NavAction[];
  /** 우측 커스텀 영역 (예: 작성자용 수정·삭제 버튼) — rightActions 뒤에 렌더 */
  trailing?: ReactNode;
  className?: string;
}

export function TopNavigation({ title, leftAction, rightActions = [], trailing, className }: TopNavigationProps) {
  return (
    <header
      className={cn("flex h-[56px] w-full items-center bg-background-default px-[4px]", className)}
    >
      {leftAction && <IconButton variant="ghost" {...leftAction} />}
      <div className={cn("min-w-0 flex-1 px-[12px]", !leftAction && "pl-[16px]")}>
        {title && <h1 className="truncate heading-sm text-text-default">{title}</h1>}
      </div>
      {rightActions.map((action) => (
        <IconButton key={action.label} variant="ghost" {...action} />
      ))}
      {trailing && <div className="flex shrink-0 items-center gap-(--spacing-8) pr-(--spacing-12)">{trailing}</div>}
    </header>
  );
}
