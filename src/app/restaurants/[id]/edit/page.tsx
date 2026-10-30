import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RestaurantSkeleton } from "@/components/restaurant/RestaurantSkeleton";
import { RestaurantFormScreen } from "@/components/screens/RestaurantFormScreen";
import { getPlace } from "@/lib/places";
import { toFormValues } from "@/lib/restaurant-form";

export const metadata: Metadata = { title: "맛집 수정 · 구로 맛길" };

export default function EditRestaurantPage({ params }: PageProps<"/restaurants/[id]/edit">) {
  return (
    <Suspense fallback={<RestaurantSkeleton />}>
      {params.then(({ id }) => (
        <EditForm id={id} />
      ))}
    </Suspense>
  );
}

async function EditForm({ id }: { id: string }) {
  const restaurant = await getPlace(id);
  if (!restaurant?.mine) notFound();
  return <RestaurantFormScreen mode="edit" restaurantId={id} initialValues={toFormValues(restaurant)} />;
}
