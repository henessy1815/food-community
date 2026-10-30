import "server-only";
import type { PlaceSearchItem, ReverseGeocodeBody } from "@/lib/place";

/*
 * 네이버 API — 키는 서버 환경변수에서만 읽는다 (NEXT_PUBLIC_ 금지)
 * - 지역 검색: NCP NAVER API HUB (NCP_SEARCH_KEY_ID · NCP_SEARCH_KEY, 비우면 지도 키 사용)
 * - Reverse Geocoding: NCP Maps (NCP_MAP_KEY_ID · NCP_MAP_KEY)
 * - Dynamic Map(JS SDK): NCP Maps (NCP_MAP_KEY_ID) — 브라우저에서 로드되는 공개 키, NCP 콘솔의 Web 서비스 URL로 보호
 */

const LOCAL_SEARCH_URL = "https://naverapihub.apigw.ntruss.com/search/v1/local";
const REVERSE_GEOCODE_URL = "https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc";
const MAP_SDK_URL = "https://oapi.map.naver.com/openapi/v3/maps.js";

function requireEnv(...names: string[]) {
  const values = names.map((name) => process.env[name]);
  if (values.some((v) => !v)) throw new Error(`${names.join(" · ")} 환경변수가 필요합니다 (.env.local)`);
  return values as string[];
}

interface LocalSearchItem {
  title: string;
  category: string;
  /** 지번 주소 */
  address: string;
  /** 도로명 주소 */
  roadAddress: string;
  /** WGS84 경도 (× 1e7 정수 문자열) */
  mapx: string;
  /** WGS84 위도 (× 1e7 정수 문자열) */
  mapy: string;
}

/** mapx·mapy → 도 단위 — × 1e7 정수면 나누고, 이미 소수면 그대로 */
function degrees(value: string) {
  const n = Number(value);
  return Math.abs(n) > 1000 ? n / 1e7 : n;
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

/** 검색어 강조 <b> 태그와 HTML 엔티티 제거 */
function plain(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/&(amp|lt|gt|quot|#39);/g, (e) => ENTITIES[e]);
}

/** 지역 검색 키 — 별도 키가 없으면 같은 NCP Application의 지도 키로 호출 */
function searchKeys() {
  const id = process.env.NCP_SEARCH_KEY_ID || process.env.NCP_MAP_KEY_ID;
  const key = process.env.NCP_SEARCH_KEY || process.env.NCP_MAP_KEY;
  if (!id || !key) throw new Error("NCP_SEARCH_KEY_ID · NCP_SEARCH_KEY 환경변수가 필요합니다 (.env.local)");
  return [id, key];
}

/** 네이버 지역 검색 (NAVER API HUB) — 최대 5건, mapx·mapy는 lng·lat로 바꿔 돌려준다 */
export async function searchLocal(query: string): Promise<PlaceSearchItem[]> {
  const [id, key] = searchKeys();
  const url = `${LOCAL_SEARCH_URL}?${new URLSearchParams({ query, display: "5", sort: "random" })}`;

  const res = await fetch(url, {
    headers: { "x-ncp-apigw-api-key-id": id, "x-ncp-apigw-api-key": key },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`네이버 지역 검색 실패: ${res.status} ${await res.text()}`);

  const { items = [] } = (await res.json()) as { items?: LocalSearchItem[] };
  return items.map((item) => ({
    name: plain(item.title),
    category: item.category.split(">").join(" · "),
    address: item.address || item.roadAddress,
    roadAddress: item.roadAddress || undefined,
    lat: degrees(item.mapy),
    lng: degrees(item.mapx),
  }));
}

/** 네이버 지도 JS SDK 스크립트 주소 — Key ID는 SDK 특성상 브라우저에 전달된다 (Key 시크릿은 서버에만) */
export function mapSdkSrc() {
  const [id] = requireEnv("NCP_MAP_KEY_ID");
  return `${MAP_SDK_URL}?${new URLSearchParams({ ncpKeyId: id })}`;
}

interface GeocodeResult {
  name: "roadaddr" | "addr";
  region: Record<"area1" | "area2" | "area3" | "area4", { name: string }>;
  land: {
    /** 지번 주소에서 "2"면 산 */
    type: string;
    /** 도로명 (roadaddr) */
    name?: string;
    number1: string;
    number2: string;
    /** roadaddr의 건물명 */
    addition0?: { type: string; value: string };
  };
}

/** 네이버 Reverse Geocoding — 좌표 → 도로명 주소(없으면 지번) · 건물명. 주소가 없는 곳(바다 등)이면 null */
export async function reverseGeocode({ lat, lng }: { lat: number; lng: number }): Promise<ReverseGeocodeBody | null> {
  const [id, key] = requireEnv("NCP_MAP_KEY_ID", "NCP_MAP_KEY");
  const url = `${REVERSE_GEOCODE_URL}?${new URLSearchParams({
    coords: `${lng},${lat}`,
    orders: "roadaddr,addr",
    output: "json",
  })}`;

  const res = await fetch(url, {
    headers: { "x-ncp-apigw-api-key-id": id, "x-ncp-apigw-api-key": key },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`네이버 Reverse Geocoding 실패: ${res.status}`);

  const { results = [] } = (await res.json()) as { results?: GeocodeResult[] };
  const road = results.find((r) => r.name === "roadaddr");
  const lot = results.find((r) => r.name === "addr");
  const number = ({ number1, number2 }: GeocodeResult["land"]) => (number2 ? `${number1}-${number2}` : number1);
  const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" ");

  if (road?.land.name) {
    const { region, land } = road;
    const building = land.addition0?.type === "building" ? land.addition0.value : "";
    return { address: join(region.area1.name, region.area2.name, land.name, number(land)), building: building || undefined };
  }
  if (lot) {
    const { region, land } = lot;
    return {
      address: join(region.area1.name, region.area2.name, region.area3.name, region.area4.name, `${land.type === "2" ? "산 " : ""}${number(land)}`),
    };
  }
  return null;
}
