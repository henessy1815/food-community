import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import type { Restaurant } from "@/lib/restaurants";

/**
 * 카드 그리드 — 모바일 1열 → 2열(sm) → 3열(lg) → 4열(xl, 최대 1280)
 * onDelete를 넘기면 카드 사진 우측 상단에 삭제 버튼을 둔다 (마이 페이지)
 */
export function RestaurantGrid({
  restaurants,
  meta,
  onDelete,
  className,
}: {
  restaurants: Restaurant[];
  meta: (r: Restaurant) => string;
  onDelete?: (r: Restaurant) => void;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-(--spacing-12) sm:grid-cols-2 sm:gap-(--spacing-16) lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {restaurants.map((r) => (
        <li key={r.id} className="relative flex">
          <Link
            href={`/restaurants/${r.id}`}
            className="flex w-full rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-brand"
          >
            <Card image={r.photos[0]} title={r.name} description={r.summary} meta={meta(r)} />
          </Link>
          {onDelete && (
            <IconButton
              icon="delete"
              label={`${r.name} 삭제`}
              variant="circle-neutral"
              onClick={() => onDelete(r)}
              className="absolute top-(--spacing-8) right-(--spacing-8)"
            />
          )}
        </li>
      ))}
    </ul>
  );
}
