import { Suspense } from "react";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { Spinner } from "@/components/ui/Spinner";
import { getWeeklyStats, listPlaces } from "@/lib/places";

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
  const [restaurants, weeklyStats] = await Promise.all([listPlaces(), getWeeklyStats()]);
  return <HomeScreen restaurants={restaurants} weeklyStats={weeklyStats} />;
}
