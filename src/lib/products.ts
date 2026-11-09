/* 강연·모임 상품과 주문 — 서버(src/lib/shop.ts)가 product 테이블로 조립해 내려주는 화면 모델 · 클라이언트에서도 쓰는 표기 함수 */

import type { Photo } from "@/lib/restaurants";

/** 판매 중 · 정원 마감 · 판매 기간 종료 */
export type ProductStatus = "on_sale" | "closed" | "ended";

/** 행사 며칠 전까지 전액 환불 */
export const REFUND_DAYS = 3;

export interface ScheduleStep {
  /** 11:00 */
  time: string;
  description: string;
}

/**
 * product 테이블 한 행을 화면용으로 조립한 모델
 * - 이미지는 DB에 버킷 안 경로(image_path_main · image_path_detail)만 두고, 서버가 SUPABASE_STORAGE_URL과 합쳐 주소를 만든다
 * - 선택(?) 항목은 아직 DB 컬럼이 없어 비어 있으면 화면에서 숨긴다
 */
export interface Product {
  id: string;
  /** product.name */
  title: string;
  /** 모임 소개 본문 */
  description: string;
  /** 메인 배너 이미지 — image_path_main */
  bannerImage: Photo;
  /** 상세 상단 사진 · 결제 내역 썸네일 — image_path_detail */
  photos: Photo[];
  /** 행사 시작 (ISO) — event_at */
  startsAt: string;
  /** 행사 종료 (ISO) */
  endsAt?: string;
  /** 모이는 곳 — addresss */
  address: string;
  price: number;
  /** 정원 — capacity */
  maxSeats: number;
  /** 현재 결제 인원 */
  seats: number;
  /** 전액 환불 마감 (ISO) */
  refundDeadline: string;
  status: ProductStatus;
  /** 로그인 사용자가 이미 결제한 주문 */
  myOrder: { id: string; paidAt: string } | null;
  /** 맛집 투어 모임 · 사장님 강연 */
  category?: string;
  summary?: string;
  /** 결제 내역 한 줄 표기 — 광명 철산역 (없으면 address) */
  region?: string;
  /** 결제 완료 인사 — 철산역에서 만나요 */
  meetingSpot?: string;
  parking?: string;
  schedule?: ScheduleStep[];
  /** 포함 · 준비물 안내 */
  includes?: string[];
}

/** 결제 완료 · 결제 실패 · 환불 처리 중 · 환불 완료 */
export type OrderStatus = "paid" | "failed" | "refunding" | "refunded";

export interface Order {
  id: string;
  /** 20261102-0001 */
  orderNo: string;
  product: Product;
  amount: number;
  /** 신한카드 · 일시불 */
  method: string;
  status: OrderStatus;
  paidAt?: string;
  canceledAt?: string;
  refundedAt?: string;
  failReason?: string;
  /** 행사가 끝나 참여 완료로 보여줄 주문 */
  attended: boolean;
  /** 지금 취소하면 전액 환불 */
  cancelable: boolean;
}

/** /api/payments/** 실패 응답 */
export interface OrderErrorBody {
  code?:
    | "SOLD_OUT"
    | "ENDED"
    | "ALREADY_PAID"
    | "NOT_CANCELABLE"
    /** 포트원 결제 상태가 PAID가 아님 (실패 · 미완료) */
    | "PAYMENT_NOT_PAID"
    /** 서버 검증 실패 — 자동 환불됨 */
    | "VERIFICATION_FAILED";
  message: string;
  /** 정원 마감 시 최신 상품 (참여 인원 갱신용) */
  product?: Product;
}

/**
 * POST /api/payments/prepare 응답 — 그대로 PortOne.requestPayment()에 넘긴다.
 * 금액 · 상품명 · paymentId · customData는 모두 서버가 정한다.
 */
export interface PaymentRequestParams {
  storeId: string;
  channelKey: string;
  /** uuid — payment.transaction_key */
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency: "KRW";
  payMethod: "CARD";
  /** 결제 완료 페이지 (/products/[id]/complete) */
  redirectUrl: string;
  customData: { productId: string; userId: string };
}

/** POST /api/payments/complete 성공 응답 */
export interface PaymentCompletedBody {
  orderId: string;
}

/** 20261106-1A2B3C4D — 결제일(KST) + paymentId 앞 8자리 */
export function orderNumber(paymentId: string, iso: string) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date(iso)).replaceAll("-", "");
  return `${ymd}-${paymentId.slice(0, 8).toUpperCase()}`;
}

/** 결제 실패 화면용 주문 — 원장에 기록되지 않은 결제 시도 */
export function failedOrder(product: Product, paymentId: string, failReason: string, now = new Date().toISOString()): Order {
  return {
    id: paymentId,
    orderNo: orderNumber(paymentId, now),
    product,
    amount: product.price,
    method: "",
    status: "failed",
    failReason,
    attended: false,
    cancelable: false,
  };
}

/* ---------- 표기 ---------- */

const TIME_ZONE = "Asia/Seoul";

const partsFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

const longWeekday = new Intl.DateTimeFormat("ko-KR", { timeZone: TIME_ZONE, weekday: "long" });

function kst(iso: string) {
  const p = Object.fromEntries(partsFormat.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    weekday: p.weekday,
    hour: Number(p.hour),
    minute: Number(p.minute),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 25,000원 */
export function formatPrice(won: number) {
  return `${won.toLocaleString("ko-KR")}원`;
}

/** 11/22(토) */
export function formatMonthDay(iso: string) {
  const t = kst(iso);
  return `${t.month}/${t.day}(${t.weekday})`;
}

/** 11/02 — 결제 완료 표기 */
export function formatShortDate(iso: string) {
  const t = kst(iso);
  return `${pad(t.month)}/${pad(t.day)}`;
}

/** 2026.11.02 */
export function formatDate(iso: string) {
  const t = kst(iso);
  return `${t.year}.${pad(t.month)}.${pad(t.day)}`;
}

/** 10.15 */
export function formatDotDate(iso: string) {
  const t = kst(iso);
  return `${pad(t.month)}.${pad(t.day)}`;
}

/** 11:00 */
function formatClock(iso: string) {
  const t = kst(iso);
  return `${pad(t.hour)}:${pad(t.minute)}`;
}

/** 오전 11:00 · 오후 1:30 */
function formatMeridiem(iso: string) {
  const { hour, minute } = kst(iso);
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour < 12 ? "오전" : "오후"} ${h}:${pad(minute)}`;
}

/** 배너: 11/22(토) 11:00 */
export function bannerWhen(p: Pick<Product, "startsAt">) {
  return `${formatMonthDay(p.startsAt)} ${formatClock(p.startsAt)}`;
}

/** 목록·영수증: 11/22(토) 오전 11:00 */
export function shortWhen(p: Pick<Product, "startsAt">) {
  return `${formatMonthDay(p.startsAt)} ${formatMeridiem(p.startsAt)}`;
}

/** 상세: 2026.11.22 (토) 오전 11:00 – 오후 1:30 (종료 시각이 없으면 시작 시각만) */
export function fullWhen(p: Pick<Product, "startsAt" | "endsAt">) {
  const t = kst(p.startsAt);
  const start = `${formatDate(p.startsAt)} (${t.weekday}) ${formatMeridiem(p.startsAt)}`;
  return p.endsAt ? `${start} – ${formatMeridiem(p.endsAt)}` : start;
}

/** 결제 완료 인사: 11월 22일 토요일, 철산역에서 만나요! (모이는 곳 별칭이 없으면 날짜만) */
export function meetingGreeting(p: Pick<Product, "startsAt" | "meetingSpot">) {
  const t = kst(p.startsAt);
  const day = `${t.month}월 ${t.day}일 ${longWeekday.format(new Date(p.startsAt))}`;
  return p.meetingSpot ? `${day}, ${p.meetingSpot}에서 만나요!` : `${day}에 만나요!`;
}

/** 결제 내역 한 줄 위치 표기 */
export function regionLabel(p: Pick<Product, "region" | "address">) {
  return p.region ?? p.address;
}

export function remainingSeats(p: Pick<Product, "seats" | "maxSeats">) {
  return Math.max(0, p.maxSeats - p.seats);
}

export function seatsLabel(p: Pick<Product, "seats" | "maxSeats">) {
  return `${p.seats} / ${p.maxSeats}명`;
}
