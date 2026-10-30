import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/foundations/Icon";
import { Button } from "./Button";

export interface EmptyAction {
  label: string;
  onClick?: () => void;
  icon?: IconName;
}

export interface EmptyProps {
  title: ReactNode;
  description?: ReactNode;
  /** 비주얼: 아이콘 이름 또는 그림 노드 — 생략하면 제외 */
  visual?: IconName | ReactNode;
  primaryAction?: EmptyAction;
  secondaryAction?: EmptyAction;
  className?: string;
}

export function Empty({ title, description, visual, primaryAction, secondaryAction, className }: EmptyProps) {
  return (
    <div
      className={cn("flex w-full flex-col items-center justify-center gap-[16px] p-[24px] text-center", className)}
    >
      {visual &&
        (typeof visual === "string" ? (
          <div className="flex size-[64px] items-center justify-center rounded-full bg-background-muted text-text-tertiary">
            <Icon name={visual as IconName} size={32} />
          </div>
        ) : (
          visual
        ))}
      <div className="flex w-full flex-col items-center gap-[6px]">
        <p className="heading-sm text-text-default">{title}</p>
        {description && <p className="body-md text-text-secondary">{description}</p>}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex justify-center gap-[8px]">
          {secondaryAction && (
            <Button variant="secondary" iconLeft={secondaryAction.icon} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button variant="primary" iconLeft={primaryAction.icon} onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
