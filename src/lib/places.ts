import "server-only";
import { connection } from "next/server";
import { DEFAULT_AVATAR } from "@/lib/auth";
import {
  contentError,
  imageError,
  placeNameError,
  titleError,
  type PlaceErrorBody,
  type PlaceLocation,
} from "@/lib/place";
import type { Restaurant } from "@/lib/restaurants";
import { getStorageUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const PLACE_IMAGE_BUCKET = "place-image";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLACE_SELECT =
  "id, title, content, user_id, created_at, place_name, address, lat, lng, place_image(id, image_path, created_at)";

type Supabase = Awaited<ReturnType<typeof createClient>>;

interface PlaceImageRow {
  id: string;
  image_path: string;
  created_at: string;
}

interface PlaceRow {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  place_name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  place_image: PlaceImageRow[];
}

/* ───────────── 조회 ───────────── */

/*
 * 로더는 모두 connection()으로 시작한다 — supabase auth(getUser)와 날짜 표기가 Date.now()를 쓰므로
 * cacheComponents · runtime prefetch 단계가 아닌 실제 요청 시점에만 실행해야 한다.
 */

/** 최신순 맛집 목록 — query: 이름·내용 검색 · userId: 특정 사용자의 글 */
export async function listPlaces({ query, userId }: { query?: string; userId?: string } = {}) {
  await connection();
  const supabase = await createClient();
  let request = supabase
    .from("place")
    .select(PLACE_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (userId) request = request.eq("user_id", userId);
  if (query !== undefined) {
    // PostgREST or() 문법·LIKE 와일드카드와 겹치는 문자는 공백 처리
    const term = query.replace(/[%_\\",().*]/g, " ").trim();
    if (!term) return [];
    request = request.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
  }

  const { data, error } = await request;
  if (error) throw new Error(`맛집 목록을 불러오지 못했어요: ${error.message}`);
  return toRestaurants(supabase, data as PlaceRow[]);
}

/** 맛집 상세 — 없거나 id 형식이 잘못되면 null */
export async function getPlace(id: string) {
  if (!UUID.test(id)) return null;
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("place")
    .select(PLACE_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(`맛집을 불러오지 못했어요: ${error.message}`);
  if (!data) return null;
  const [restaurant] = await toRestaurants(supabase, [data as PlaceRow]);
  return restaurant;
}

/** 최근 7일간 올라온 맛집 수 — 메인 배너 */
export async function getWeeklyStats() {
  await connection();
  const supabase = await createClient();
  const end = new Date();
  const start = new Date(end.getTime() - 7 * DAY);

  const { count } = await supabase
    .from("place")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .gte("created_at", start.toISOString());

  return { period: `${monthDay(start)} – ${monthDay(end)}`, count: count ?? 0 };
}

export function placeImageUrl(path: string) {
  return `${getStorageUrl()}/${PLACE_IMAGE_BUCKET}/${path}`;
}

async function toRestaurants(supabase: Supabase, rows: PlaceRow[]): Promise<Restaurant[]> {
  if (rows.length === 0) return [];

  const [{ data: auth }, { data: profiles }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("profile")
      .select("user_id, nickname, image_path")
      .in("user_id", [...new Set(rows.map((r) => r.user_id))]),
  ]);
  const profileOf = new Map((profiles ?? []).map((p) => [p.user_id as string, p]));
  const now = Date.now();

  return rows.map((row) => {
    const profile = profileOf.get(row.user_id);
    const createdAt = new Date(row.created_at);
    return {
      id: row.id,
      name: row.title,
      summary: row.content,
      body: row.content,
      photos: [...row.place_image]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((image, i) => ({ id: image.id, src: placeImageUrl(image.image_path), alt: `${row.title} 사진 ${i + 1}` })),
      author: {
        nickname: profile?.nickname ?? "구로 이웃",
        avatar: profile?.image_path ?? DEFAULT_AVATAR,
      },
      createdAt: row.created_at,
      postedAgo: relativeTime(createdAt, now),
      postedAt: `${dateLabel(createdAt)} · ${TIME.format(createdAt)}`,
      postedDate: dateLabel(createdAt),
      mine: auth.user?.id === row.user_id,
      placeName: row.place_name ?? undefined,
      address: row.address ?? undefined,
      lat: row.lat ?? undefined,
      lng: row.lng ?? undefined,
    };
  });
}

/* ───────────── 작성·수정 (BFF Route Handler 전용) ───────────── */

export type PlaceFormInput =
  | { ok: true; title: string; content: string; location: PlaceLocation; files: File[] }
  | { ok: false; error: PlaceErrorBody };

/** multipart: title · content · placeName · address · lat · lng(주소·좌표는 검색으로 고른 장소만) · photos(File, 여러 개) */
export function readPlaceForm(form: FormData): PlaceFormInput {
  const title = String(form.get("title") ?? "").trim();
  const content = String(form.get("content") ?? "").trim();
  const location = readLocation(form);
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  const tError = titleError(title);
  if (tError) return { ok: false, error: { field: "title", message: tError } };
  const cError = contentError(content);
  if (cError) return { ok: false, error: { field: "content", message: cError } };
  if (!location) return { ok: false, error: { field: "location", message: "장소 정보가 올바르지 않아요." } };
  const lError = placeNameError(location.name);
  if (lError) return { ok: false, error: { field: "location", message: lError } };
  const fError = files.map(imageError).find(Boolean);
  if (fError) return { ok: false, error: { field: "photos", message: fError } };

  return { ok: true, title, content, location, files };
}

/** 주소가 있으면 좌표도 함께 와야 한다 (DB 제약과 동일) */
function readLocation(form: FormData): PlaceLocation | null {
  const name = String(form.get("placeName") ?? "").trim();
  const address = String(form.get("address") ?? "").trim();
  if (!address) return { name };
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));
  if (address.length > 200 || !form.get("lat") || !form.get("lng") || isNaN(lat + lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { name, address, lat, lng };
}

/** place 테이블 장소 컬럼 */
export function locationColumns({ name, address, lat, lng }: PlaceLocation) {
  return { place_name: name, address: address ?? null, lat: lat ?? null, lng: lng ?? null };
}

/** place-image 버킷에 uuidv4 파일명으로 업로드 — 하나라도 실패하면 올린 파일을 지우고 null */
export async function uploadPlaceImages(supabase: Supabase, files: File[]) {
  const paths = files.map((file) => `${crypto.randomUUID()}.${EXT[file.type]}`);
  const results = await Promise.all(
    files.map((file, i) =>
      supabase.storage.from(PLACE_IMAGE_BUCKET).upload(paths[i], file, { contentType: file.type }),
    ),
  );
  if (results.every((r) => !r.error)) return paths;

  await removePlaceImageFiles(
    supabase,
    paths.filter((_, i) => !results[i].error),
  );
  return null;
}

/** place_image에 파일 경로 저장 — 올린 순서대로 보이도록 created_at을 1ms씩 띄운다 */
export async function insertPlaceImages(supabase: Supabase, placeId: string, paths: string[]) {
  const base = Date.now();
  const { error } = await supabase.from("place_image").insert(
    paths.map((image_path, i) => ({
      place_id: placeId,
      image_path,
      created_at: new Date(base + i).toISOString(),
    })),
  );
  return error;
}

export async function removePlaceImageFiles(supabase: Supabase, paths: string[]) {
  if (paths.length > 0) await supabase.storage.from(PLACE_IMAGE_BUCKET).remove(paths);
}

/* ───────────── 날짜 표기 (KST) ───────────── */

const DAY = 24 * 60 * 60 * 1000;
const DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });
const TIME = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "numeric", minute: "2-digit" });

function dateLabel(date: Date) {
  return DATE.format(date).replaceAll("-", ".");
}

function monthDay(date: Date) {
  return dateLabel(date).slice(5);
}

function relativeTime(date: Date, now: number) {
  const minutes = Math.floor((now - date.getTime()) / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}시간 전`;
  const days = Math.floor(minutes / (24 * 60));
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  return dateLabel(date);
}
