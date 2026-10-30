import { Skeleton } from "@/components/ui/Skeleton";

/** 상세 · 수정 화면 로딩 폴백 */
export function RestaurantSkeleton() {
  return (
    <div aria-busy className="mx-auto flex w-full max-w-[720px] flex-col gap-(--spacing-16)">
      <Skeleton variant="rect" width="100%" height={280} className="rounded-none" />
      <div className="flex flex-col gap-(--spacing-8) px-(--spacing-16)">
        <Skeleton width={96} height={20} />
        <Skeleton width="60%" height={29} />
        <Skeleton height={22} />
        <Skeleton width="80%" height={22} />
      </div>
    </div>
  );
}
