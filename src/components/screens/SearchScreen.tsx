"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { RestaurantGrid } from "@/components/restaurant/RestaurantGrid";
import { Empty } from "@/components/ui/Empty";
import { TextField } from "@/components/ui/TextField";
import { listMeta, type Restaurant } from "@/lib/restaurants";

/** q: 현재 검색어 · results: 최신순 검색 결과 */
export function SearchScreen({ q, results }: { q: string; results: Restaurant[] }) {
  const router = useRouter();
  const [input, setInput] = useState(q);

  const clear = () => {
    setInput("");
    router.replace("/search");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader back title="검색" />

      <Container>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const next = input.trim();
            router.replace(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
          }}
          className="md:max-w-[640px]"
        >
          <TextField
            size="lg"
            iconLeft="search"
            enterKeyHint="search"
            aria-label="맛집 검색"
            placeholder="맛집 이름, 내용으로 검색"
            autoFocus={!q}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onClear={clear}
          />
        </form>
      </Container>

      {q &&
        (results.length > 0 ? (
          <Container as="main" className="flex flex-col gap-(--spacing-12) pt-(--spacing-16) pb-(--spacing-32)">
            <h2 className="label-lg text-text-default">
              ‘{q}’ 검색 결과 {results.length}개
            </h2>
            <RestaurantGrid restaurants={results} meta={listMeta} />
            <p className="py-(--spacing-12) text-center label-md text-text-tertiary">마지막 글입니다</p>
          </Container>
        ) : (
          <Container as="main" className="flex flex-1 flex-col justify-center py-(--spacing-32)">
            <Empty
              visual="search"
              title="검색 결과가 없어요"
              description="다른 단어로 검색하거나 맛집 이름을 다시 확인해 보세요."
              secondaryAction={{ label: "검색어 지우기", onClick: clear }}
              primaryAction={{ label: "맛집 등록", icon: "plus", onClick: () => router.push("/restaurants/new") }}
              className="mx-auto max-w-[400px]"
            />
          </Container>
        ))}
    </div>
  );
}
