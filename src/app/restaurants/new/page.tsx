import type { Metadata } from "next";
import { RestaurantFormScreen } from "@/components/screens/RestaurantFormScreen";

export const metadata: Metadata = { title: "맛집 등록 · 구로 맛길" };

export default function NewRestaurantPage() {
  return <RestaurantFormScreen mode="create" />;
}
