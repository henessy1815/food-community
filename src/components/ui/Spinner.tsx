import { cn } from "@/lib/cn";
import { Icon, type IconSize } from "@/components/foundations/Icon";

export interface SpinnerProps {
  /** 디자인 기본 md(24). 버튼 등 내부용으로 다른 사이즈 허용 */
  size?: IconSize;
  className?: string;
  label?: string;
}

export function Spinner({ size = 24, className, label = "로딩 중" }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex text-text-brand", className)}>
      <Icon name="loader" size={size} className="animate-spin" />
    </span>
  );
}
