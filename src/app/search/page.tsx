import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchScreen } from "@/components/screens/SearchScreen";
import { listPlaces } from "@/lib/places";

export const metadata: Metadata = { title: "검색 · 구로 맛길" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  // searchParams는 요청 시점 데이터라 Suspense 경계가 필요
  return (
    <Suspense>
      {searchParams.then(({ q }) => (
        <SearchResults q={(Array.isArray(q) ? q[0] : q)?.trim() ?? ""} />
      ))}
    </Suspense>
  );
}

async function SearchResults({ q }: { q: string }) {
  const results = q ? await listPlaces({ query: q }) : [];
  // key: 검색어가 바뀌면 입력창 상태를 새 검색어로 초기화
  return <SearchScreen key={q} q={q} results={results} />;
}
