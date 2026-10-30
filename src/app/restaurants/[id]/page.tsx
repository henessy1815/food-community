import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RestaurantSkeleton } from "@/components/restaurant/RestaurantSkeleton";
import { RestaurantDetailScreen } from "@/components/screens/RestaurantDetailScreen";
import { getPlace } from "@/lib/places";

export async function generateMetadata({ params }: PageProps<"/restaurants/[id]">): Promise<Metadata> {
  const { id } = await params;
  const restaurant = await getPlace(id);
  return { title: restaurant ? `${restaurant.name} · 구로 맛길` : "구로 맛길" };
}

export default function RestaurantPage({ params }: PageProps<"/restaurants/[id]">) {
  // params는 요청 시점 데이터 — Suspense 안에서 읽어야 즉시 내비게이션이 가능
  return (
    <Suspense fallback={<RestaurantSkeleton />}>
      {params.then(({ id }) => (
        <Detail id={id} />
      ))}
    </Suspense>
  );
}

async function Detail({ id }: { id: string }) {
  const restaurant = await getPlace(id);
  if (!restaurant) notFound();
  return <RestaurantDetailScreen restaurant={restaurant} />;
}
