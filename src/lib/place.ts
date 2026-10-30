/* 맛집 등록·수정 검증 — 클라이언트 폼과 BFF(/api/places)가 함께 사용 */

export const PLACE_IMAGE_TYPES = ["image/jpeg", "image/png"];
export const PLACE_IMAGE_MAX_MB = 10;
export const PLACE_IMAGE_MAX_COUNT = 5;
export const TITLE_MAX = 50;
export const CONTENT_MIN = 10;
export const CONTENT_MAX = 2000;
export const PLACE_NAME_MAX = 50;

/** 맛집 장소 — 네이버 지역 검색으로 고르면 주소·좌표까지, 직접 입력하면 장소명만 */
export interface PlaceLocation {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
}

/** GET /api/places/search 결과 한 건 */
export interface PlaceSearchItem {
  name: string;
  /** 한식 · 칼국수 */
  category: string;
  /** 지번 주소 (없으면 도로명) */
  address: string;
  /** 도로명 주소 */
  roadAddress?: string;
  /** 위도 (mapy) */
  lat: number;
  /** 경도 (mapx) */
  lng: number;
}

export interface PlaceSearchBody {
  items: PlaceSearchItem[];
}

/** GET /api/places/reverse 결과 — 지도 핀 위치의 주소 */
export interface ReverseGeocodeBody {
  /** 도로명 주소 (없으면 지번) */
  address: string;
  /** 건물명 (서울특별시청) */
  building?: string;
}

export function titleError(value: string) {
  const length = value.trim().length;
  if (length === 0) return "맛집 이름을 입력해주세요.";
  if (length > TITLE_MAX) return `맛집 이름은 ${TITLE_MAX}자 이하로 입력해주세요.`;
  return undefined;
}

export function contentError(value: string) {
  const length = value.trim().length;
  if (length === 0) return "맛집 내용을 입력해주세요.";
  if (length < CONTENT_MIN) return `맛집 내용은 ${CONTENT_MIN}자 이상 입력해주세요.`;
  if (length > CONTENT_MAX) return `맛집 내용은 ${CONTENT_MAX}자 이하로 입력해주세요.`;
  return undefined;
}

export function imageError(file: Pick<File, "type" | "size">) {
  if (!PLACE_IMAGE_TYPES.includes(file.type)) return "JPG·PNG 사진만 올릴 수 있어요.";
  if (file.size > PLACE_IMAGE_MAX_MB * 1024 * 1024) return `${PLACE_IMAGE_MAX_MB}MB를 넘어 올릴 수 없어요`;
  return undefined;
}

export function photoCountError(count: number) {
  if (count === 0) return "사진을 1장 이상 올려주세요.";
  if (count > PLACE_IMAGE_MAX_COUNT) return `사진은 최대 ${PLACE_IMAGE_MAX_COUNT}장까지 올릴 수 있어요.`;
  return undefined;
}

export function placeNameError(value: string) {
  const length = value.trim().length;
  if (length === 0) return "장소명을 입력해주세요.";
  if (length > PLACE_NAME_MAX) return `장소명은 ${PLACE_NAME_MAX}자 이하로 입력해주세요.`;
  return undefined;
}

export function locationError(location: PlaceLocation | null) {
  if (!location) return "장소를 선택해주세요.";
  return placeNameError(location.name);
}

/** POST /api/places · PATCH /api/places/[id] 실패 응답 */
export interface PlaceErrorBody {
  field?: "photos" | "title" | "content" | "location";
  message: string;
}

/** 성공 응답 */
export interface PlaceSavedBody {
  id: string;
}

/** DELETE /api/places/[id] 호출 — 실패하면 사용자에게 보여줄 메시지 */
export async function deletePlace(id: string) {
  try {
    const res = await fetch(`/api/places/${id}`, { method: "DELETE" });
    if (res.ok) return undefined;
    const { message } = (await res.json()) as PlaceErrorBody;
    return message;
  } catch {
    return "맛집을 삭제하지 못했어요.";
  }
}
