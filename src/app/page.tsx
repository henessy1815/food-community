import { Suspense } from "react";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { Spinner } from "@/components/ui/Spinner";
import { listPlaces } from "@/lib/places";
import { listBannerProducts } from "@/lib/shop";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const [restaurants, products] = await Promise.all([listPlaces(), listBannerProducts()]);
  return <HomeScreen restaurants={restaurants} products={products} />;
}
