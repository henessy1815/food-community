/* 화면에서 쓰는 맛집 모델 — 서버(src/lib/places.ts)가 place · place_image · profile로 조립해 내려준다 */

export interface Photo {
  /** place_image.id — 수정 화면에서 유지·삭제 구분 */
  id?: string;
  src: string;
  alt: string;
}

export interface Author {
  nickname: string;
  avatar: string;
}

export interface Restaurant {
  id: string;
  name: string;
  /** 카드 설명 */
  summary: string;
  /** 상세 본문 */
  body: string;
  photos: Photo[];
  author: Author;
  /** 정렬용 작성 시각 (ISO) */
  createdAt: string;
  /** 카드 메타에 노출되는 상대 시간 */
  postedAgo: string;
  /** 상세 화면 작성일 표기 (2026.10.16 · 오후 2:14) */
  postedAt: string;
  /** 마이 페이지 작성일 (2026.10.16) */
  postedDate: string;
  /** 로그인 사용자가 쓴 글 */
  mine: boolean;
  /** 지역 뱃지 — place 테이블에 컬럼이 생기면 채운다 */
  region?: string;
  /** 장소명 — 네이버 지역 검색 결과 또는 직접 입력 */
  placeName?: string;
  /** 도로명 주소 — 직접 입력한 장소는 없음 */
  address?: string;
  lat?: number;
  lng?: number;
  addressDetail?: string;
}

/** 목록 카드 메타: 작성자 · 상대시간 */
export function listMeta(r: Restaurant) {
  return [r.region, r.author.nickname, r.postedAgo].filter(Boolean).join(" · ");
}

/** 마이 페이지 카드 메타: 작성일 */
export function myPostMeta(r: Restaurant) {
  return [r.region, r.postedDate].filter(Boolean).join(" · ");
}

export function fullAddress(r: Pick<Restaurant, "address" | "addressDetail">) {
  return r.addressDetail ? `${r.address}, ${r.addressDetail}` : (r.address ?? "");
}

/** 네이버 지도 검색 링크 — 주소가 없으면(장소명만 등록) 장소명으로 검색. 모바일에선 네이버 지도 앱으로 이어진다 */
export function naverMapUrl(r: Pick<Restaurant, "address" | "placeName">) {
  return `https://map.naver.com/p/search/${encodeURIComponent(r.address || r.placeName || "")}`;
}
