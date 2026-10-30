import { Icon } from "@/components/foundations/Icon";
import { cn } from "@/lib/cn";

/** 선택한 장소 카드 — 브랜드 핀 · 제목(주소 또는 장소명) · 보조 설명 */
export function PlaceSummary({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-(--spacing-12) rounded-[14px] border border-border-default bg-background-default p-(--spacing-12)",
        className,
      )}
    >
      <Icon name="map-pin" size={20} className="text-text-brand" />
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <p className="label-lg text-text-default">{title}</p>
        {description && <p className="label-md text-text-tertiary">{description}</p>}
      </div>
    </div>
  );
}
