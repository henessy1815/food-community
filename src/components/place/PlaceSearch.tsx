"use client";

import { useRef, useState, type FormEvent } from "react";
import { BottomBar } from "@/components/layout/BottomBar";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { Spinner } from "@/components/ui/Spinner";
import { TextField } from "@/components/ui/TextField";
import {
  PLACE_NAME_MAX,
  placeNameError,
  type PlaceErrorBody,
  type PlaceSearchBody,
  type PlaceSearchItem,
} from "@/lib/place";
import { PlaceResultItem } from "./PlaceResultItem";

type Search =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "error"; query: string; message: string }
  | { status: "done"; query: string; items: PlaceSearchItem[] };

/**
 * 장소 검색 화면 — 장소 등록(지도) 화면의 검색창을 누르면 열린다
 * 검색어 입력 → 네이버 지역 검색(BFF /api/places/search) 결과 → 고르면 onPick(검색어, 장소)
 * 결과가 없거나 "장소명 직접 입력" → 장소명 입력 → onManual(장소명)
 */
export function PlaceSearch({
  initialQuery,
  startManual = false,
  onBack,
  onPick,
  onManual,
}: {
  initialQuery: string;
  /** 지도 화면의 "장소명 직접 입력"으로 들어오면 바로 입력 화면 */
  startManual?: boolean;
  onBack: () => void;
  onPick: (query: string, place: PlaceSearchItem) => void;
  onManual: (name: string) => void;
}) {
  const [input, setInput] = useState(initialQuery);
  const [search, setSearch] = useState<Search>({ status: "idle" });
  const [manual, setManual] = useState(startManual);
  const [manualName, setManualName] = useState(initialQuery.slice(0, PLACE_NAME_MAX));
  const request = useRef<AbortController | null>(null);

  const runSearch = async (e: FormEvent) => {
    e.preventDefault();
    // 포털이어도 React 이벤트는 컴포넌트 트리를 따라 맛집 폼 onSubmit까지 올라간다
    e.stopPropagation();
    const query = input.trim();
    if (!query) return;

    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setManual(false);
    setSearch({ status: "loading", query });
    try {
      const res = await fetch(`/api/places/search?${new URLSearchParams({ query })}`, { signal: controller.signal });
      if (!res.ok) {
        const { message } = (await res.json()) as PlaceErrorBody;
        setSearch({ status: "error", query, message });
        return;
      }
      const { items } = (await res.json()) as PlaceSearchBody;
      setSearch({ status: "done", query, items });
      if (items.length === 0) setManualName(query.slice(0, PLACE_NAME_MAX));
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setSearch({ status: "error", query, message: "장소를 검색하지 못했어요. 잠시 후 다시 시도해주세요." });
    }
  };

  const clear = () => {
    request.current?.abort();
    setInput("");
    setSearch({ status: "idle" });
    setManual(false);
  };

  const goManual = () => {
    setManualName((search.status === "idle" ? input : search.query).trim().slice(0, PLACE_NAME_MAX));
    setManual(true);
  };

  const noResults = search.status === "done" && search.items.length === 0;
  const view = manual || noResults ? "manual" : search.status;
  const nameError = placeNameError(manualName);

  return (
    <>
      <PageHeader back onBack={onBack} title="장소 검색" size="narrow" />

      <Container size="narrow" className="py-(--spacing-8)">
        <form role="search" onSubmit={runSearch}>
          <TextField
            size="lg"
            iconLeft="search"
            enterKeyHint="search"
            aria-label="검색어 입력"
            placeholder="장소 또는 주소 검색"
            maxLength={PLACE_NAME_MAX}
            autoFocus={!startManual}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onClear={clear}
          />
        </form>
      </Container>

      {view === "manual" && (
        <>
          <Container size="narrow" className="flex flex-1 flex-col gap-(--spacing-24) pt-(--spacing-16) pb-(--spacing-24)">
            {noResults && (
              <Empty
                visual="search"
                title="검색 결과가 없어요"
                description="네이버에서 장소를 찾지 못했어요. 장소명을 직접 입력해 등록할 수 있어요."
              />
            )}
            <TextField
              size="lg"
              label="장소명 *"
              placeholder="장소명을 입력해주세요"
              maxLength={PLACE_NAME_MAX}
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              onClear={() => setManualName("")}
              helperText={`주소·지도 위치는 지금 지도에 선택된 위치를 그대로 써요 · ${manualName.length} / ${PLACE_NAME_MAX}`}
            />
          </Container>
          <BottomBar>
            <Button
              size="lg"
              fullWidth
              iconLeft="check"
              disabled={Boolean(nameError)}
              onClick={() => onManual(manualName.trim())}
            >
              이 이름으로 등록하기
            </Button>
          </BottomBar>
        </>
      )}

      {view === "idle" && (
        <p className="px-(--spacing-16) py-(--spacing-32) text-center label-md text-text-tertiary">
          가게 이름이나 주소를 입력하고 검색해주세요
        </p>
      )}

      {view === "loading" && (
        <div className="flex flex-1 items-center justify-center py-(--spacing-32)">
          <Spinner label="장소 검색 중" />
        </div>
      )}

      {view === "error" && search.status === "error" && (
        <Container size="narrow" className="flex flex-1 flex-col justify-center py-(--spacing-32)">
          <Empty
            visual="error"
            title="장소를 검색하지 못했어요"
            description={search.message}
            secondaryAction={{ label: "장소명 직접 입력", icon: "edit", onClick: goManual }}
          />
        </Container>
      )}

      {view === "done" && search.status === "done" && (
        <>
          <main className="mx-auto w-full max-w-[640px]">
            <div className="flex items-center justify-between gap-(--spacing-8) px-(--spacing-16) py-(--spacing-8) md:px-(--spacing-24)">
              <p className="label-md text-text-secondary">
                ‘{search.query}’ 검색 결과 {search.items.length}개
              </p>
              <p className="shrink-0 label-md text-text-tertiary">네이버 지역 검색</p>
            </div>
            <ul>
              {search.items.map((place) => (
                <li key={`${place.name}-${place.address}`}>
                  <PlaceResultItem
                    place={place}
                    onSelect={(p) => onPick(search.query, p)}
                    className="px-(--spacing-16) md:px-(--spacing-24)"
                  />
                </li>
              ))}
            </ul>
          </main>
          <div className="flex flex-1 flex-col items-center gap-(--spacing-8) px-(--spacing-16) py-(--spacing-24)">
            <p className="label-md text-text-tertiary">찾는 장소가 없나요?</p>
            <Button variant="secondary" iconLeft="edit" onClick={goManual}>
              장소명 직접 입력
            </Button>
          </div>
        </>
      )}
    </>
  );
}
