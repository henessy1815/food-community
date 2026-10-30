import { Icon } from "@/components/foundations/Icon";
import { cn } from "@/lib/cn";
import type { PlaceSearchItem } from "@/lib/place";

/** 장소 검색 결과 한 줄 — 핀 · 장소명 · 분류 · 주소 · 셰브론 */
export function PlaceResultItem({
  place,
  onSelect,
  className,
}: {
  place: PlaceSearchItem;
  onSelect: (place: PlaceSearchItem) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(place)}
      className={cn(
        "flex w-full cursor-pointer items-center gap-(--spacing-12) border-b border-border-default py-(--spacing-12) text-left",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-brand active:bg-background-muted",
        className,
      )}
    >
      <Icon name="map-pin" size={20} className="text-text-tertiary" />
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="flex min-w-0 items-center gap-[4px]">
          <span className="truncate label-lg text-text-default">{place.name}</span>
          {place.category && <span className="truncate label-md text-text-tertiary">{place.category}</span>}
        </span>
        <span className="label-md text-text-secondary">{place.address}</span>
      </span>
      <Icon name="chevron-right" size={16} className="text-text-tertiary" />
    </button>
  );
}
