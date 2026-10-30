"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BottomBar } from "@/components/layout/BottomBar";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useOverlay } from "@/components/ui/overlay";
import {
  PLACE_NAME_MAX,
  type PlaceErrorBody,
  type PlaceLocation,
  type PlaceSearchItem,
  type ReverseGeocodeBody,
} from "@/lib/place";
import { PlaceMap, type MapCenter } from "./PlaceMap";
import { PlaceSearch } from "./PlaceSearch";
import { PlaceSummary } from "./PlaceSummary";

/** 지도 핀(지도 중심) 위치와 그 주소 */
type Pin = { lat: number; lng: number } & (
  | { status: "loading" }
  | { status: "error"; message: string }
  | ({ status: "done" } & ReverseGeocodeBody)
);

/** 이전에 고른 장소로 복원 — 좌표가 있으면 그 위치, 장소명만 있으면 서울시청 지도(검색창에 장소명) */
function initialPin(location: PlaceLocation | null): Pin | null {
  if (!location?.address || location.lat === undefined || location.lng === undefined) return null;
  return { status: "done", lat: location.lat, lng: location.lng, address: location.address };
}

/**
 * 장소 등록 — 맛집 등록 폼 위에 전체 화면으로 띄운다 (폼 입력값 유지)
 * 검색 <form>이 맛집 <form> 안에 중첩되지 않도록 body로 포털한다
 * - 지도 화면: 서울시청에서 시작, 지도를 움직이면 핀(지도 중심)의 주소를 보여준다
 * - 검색창을 누르면 검색 화면(PlaceSearch)
 *   - 결과 선택 → 검색창에 검색어, 주소 영역에 지번 주소, 지도 중심은 선택한 위·경도
 *   - 직접 입력 → 검색창에 장소명, 주소·좌표는 지도에 선택돼 있던 값 유지
 */
export function PlacePicker({
  initial,
  onClose,
  onSelect,
}: {
  initial: PlaceLocation | null;
  onClose: () => void;
  onSelect: (location: PlaceLocation) => void;
}) {
  const [screen, setScreen] = useState<"map" | "search" | "manual">("map");
  // 검색 화면에선 Escape·뒤로가기로 지도 화면으로 돌아간다
  const panelRef = useOverlay(true, () => (screen === "map" ? onClose() : setScreen("map")));
  /** 검색창에 보이는 글자 — 검색어 또는 직접 입력한 장소명 */
  const [query, setQuery] = useState(initial?.name ?? "");
  /** 등록할 장소명 — 비어 있으면 핀 위치의 건물명(없으면 주소) */
  const [name, setName] = useState(initial?.name ?? "");
  const [pin, setPin] = useState(() => initialPin(initial));
  const geocode = useRef<AbortController | null>(null);

  /** 지도 이동이 끝나면 핀(지도 중심) 위치의 주소를 BFF(/api/places/reverse)로 조회 */
  const move = async ({ lat, lng }: MapCenter) => {
    if (pin?.lat === lat && pin.lng === lng) return;
    geocode.current?.abort();
    const controller = new AbortController();
    geocode.current = controller;
    setPin({ status: "loading", lat, lng });
    try {
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
      const res = await fetch(`/api/places/reverse?${params}`, { signal: controller.signal });
      if (!res.ok) {
        const { message } = (await res.json()) as PlaceErrorBody;
        setPin({ status: "error", lat, lng, message });
        return;
      }
      setPin({ status: "done", lat, lng, ...((await res.json()) as ReverseGeocodeBody) });
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setPin({ status: "error", lat, lng, message: "주소를 불러오지 못했어요." });
    }
  };

  /** 검색 결과 선택 — 지번 주소·위경도로 핀을 옮기고 지도 화면으로 */
  const pick = (searched: string, place: PlaceSearchItem) => {
    geocode.current?.abort();
    setQuery(searched);
    setName(place.name);
    setPin({ status: "done", lat: place.lat, lng: place.lng, address: place.address });
    setScreen("map");
  };

  /** 직접 입력 — 장소명만 바꾸고 핀(주소·좌표)은 그대로 */
  const manual = (value: string) => {
    setQuery(value);
    setName(value);
    setScreen("map");
  };

  const clear = () => {
    setQuery("");
    setName("");
  };

  const register = () => {
    if (pin?.status === "done") {
      onSelect({
        name: (name || pin.building || pin.address).slice(0, PLACE_NAME_MAX),
        address: pin.address,
        lat: pin.lat,
        lng: pin.lng,
      });
    } else if (name) {
      // 주소를 못 찾은 위치면 장소명만
      onSelect({ name });
    }
  };

  const canRegister = pin?.status === "done" || (pin?.status === "error" && Boolean(name));
  const pinTitle =
    pin?.status === "done" ? pin.address : pin?.status === "error" ? pin.message : "주소를 확인하는 중이에요";

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="장소 등록"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background-default outline-none"
    >
      {screen !== "map" ? (
        <PlaceSearch
          initialQuery={query}
          startManual={screen === "manual"}
          onBack={() => setScreen("map")}
          onPick={pick}
          onManual={manual}
        />
      ) : (
        <>
          <PageHeader back onBack={onClose} title="장소 등록" size="narrow" />

          <Container size="narrow" className="py-(--spacing-8)">
            {/* 누르면 검색 화면으로 — 여기서는 입력하지 않는다 */}
            <TextField
              size="lg"
              iconLeft="search"
              readOnly
              aria-label="장소 검색"
              aria-haspopup="dialog"
              placeholder="장소 또는 주소 검색"
              className="cursor-pointer"
              value={query}
              onClick={() => setScreen("search")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setScreen("search");
                }
              }}
              onClear={clear}
            />
          </Container>

          <Container size="narrow" className="flex flex-1 flex-col gap-(--spacing-16) pt-(--spacing-8) pb-(--spacing-24)">
            {/* 화면에 돌아올 때마다 핀 위치(없으면 서울시청)를 중심으로 다시 연다 */}
            <PlaceMap label={name || undefined} lat={pin?.lat} lng={pin?.lng} onMove={move} />
            <PlaceSummary
              title={pinTitle}
              description={
                pin?.status === "done" && pin.building
                  ? `${pin.building} · 지도를 움직여 핀을 가게 위치에 맞춰주세요`
                  : "지도를 움직여 핀을 가게 위치에 맞춰주세요"
              }
            />
            {!name && (
              <div className="flex items-center justify-center gap-(--spacing-8)">
                <p className="label-md text-text-tertiary">찾는 장소가 없나요?</p>
                <Button variant="secondary" size="sm" iconLeft="edit" onClick={() => setScreen("manual")}>
                  장소명 직접 입력
                </Button>
              </div>
            )}
          </Container>
          <BottomBar>
            <Button size="lg" fullWidth iconLeft="check" disabled={!canRegister} onClick={register}>
              이 위치로 등록하기
            </Button>
          </BottomBar>
        </>
      )}
    </div>,
    document.body,
  );
}
