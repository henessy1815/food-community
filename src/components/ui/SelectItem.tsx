import type { LiHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/foundations/Icon";
import type { FieldSize } from "./Field";

export interface SelectItemProps extends LiHTMLAttributes<HTMLLIElement> {
  /** 참조하는 Select의 사이즈를 따름 */
  size?: FieldSize;
  selected?: boolean;
  disabled?: boolean;
  /** 키보드 탐색 중 하이라이트 */
  highlighted?: boolean;
}

const sizeClass: Record<FieldSize, string> = {
  sm: "h-[32px] px-[10px]",
  md: "h-[40px] px-[12px]",
  lg: "h-[48px] px-[14px]",
};
const checkSize = { sm: 16, md: 20, lg: 20 } as const;

export function SelectItem({
  size = "md",
  selected = false,
  disabled = false,
  highlighted = false,
  className,
  children,
  ...rest
}: SelectItemProps) {
  return (
    <li
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      className={cn(
        "flex w-full items-center gap-[8px] rounded-[8px] bg-background-default",
        sizeClass[size],
        disabled
          ? "cursor-not-allowed text-text-disabled"
          : cn("cursor-pointer hover:bg-background-muted", selected ? "text-text-brand" : "text-text-default"),
        highlighted && !disabled && "bg-background-muted",
        className,
      )}
      {...rest}
    >
      <span className="min-w-0 flex-1 truncate body-lg">{children}</span>
      {selected && <Icon name="check" size={checkSize[size]} className="text-text-brand" />}
    </li>
  );
}
