import "server-only";
import { connection } from "next/server";
import {
  REFUND_DAYS,
  orderNumber,
  type Order,
  type OrderErrorBody,
  type OrderStatus,
  type PaymentRequestParams,
  type Product,
} from "@/lib/products";
import {
  cancelPortonePayment,
  getPortoneConfig,
  getPortonePayment,
  paymentMethodLabel,
  type PortonePayment,
} from "@/lib/portone";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStorageUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/*
 * 강연·모임 상품 · 결제 (BFF 전용) — 결제 규칙 SSOT: .claude/rules/payment.md
 * - 상품: product 테이블(공개 상품만, RLS product_select_public). 이미지는 product-image 버킷 경로만 DB에 둔다.
 * - 결제: 포트원 V2 결제창 → 서버 검증(결제 조회 API) → payment(append-only 원장) + payment_snapshot 기록.
 * - 원장 조회는 사용자 세션(RLS: 본인 행), 원장 기록은 service role로 record_payment_* 함수만 호출한다.
 */

export const PRODUCT_IMAGE_BUCKET = "product-image";

/** product.status — 이 값인 상품만 노출·판매 (RLS product_select_public과 같은 조건) */
const PUBLIC_STATUS = "Public";
const CURRENCY = "KRW";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRODUCT_SELECT =
  "id, created_at, name, description, event_at, addresss, capacity, price, image_path_main, image_path_detail, status";
const PAYMENT_SELECT =
  "id, created_at, transaction_key, type, amount, product_id, payment_snapshot(snapshot_payment, snapshot_product)";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** product 행 — 결제 스냅샷(snapshot_product)에도 이 모양 그대로 저장한다 */
interface ProductRow {
  id: string;
  created_at: string;
  name: string;
  description: string;
  event_at: string;
  /** 컬럼명 오타(s 3개) 그대로 */
  addresss: string;
  capacity: number;
  /** numeric — PostgREST가 숫자 또는 문자열로 내려준다 */
  price: number | string;
  image_path_main: string;
  image_path_detail: string;
  status: string;
}

type PaymentType = "PAID" | "CANCEL_REQUESTED" | "CANCELLED";

interface PaymentRow {
  id: string;
  created_at: string;
  transaction_key: string;
  type: PaymentType;
  amount: number | string;
  product_id: string;
  payment_snapshot: { snapshot_payment: PortonePayment; snapshot_product: ProductRow } | null;
}

type Result<T> = { ok: true; value: T } | { ok: false; status: number; error: OrderErrorBody };

const fail = (status: number, error: OrderErrorBody): { ok: false; status: number; error: OrderErrorBody } => ({
  ok: false,
  status,
  error,
});

export function productImageUrl(path: string) {
  return `${getStorageUrl()}/${PRODUCT_IMAGE_BUCKET}/${path.replace(/^\//, "")}`;
}

/** 행사 n일 전 23:59:59 (KST) */
function refundDeadline(startsAt: string, days = REFUND_DAYS) {
  const date = new Date(startsAt);
  date.setUTCDate(date.getUTCDate() - days);
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date);
  return `${ymd}T23:59:59+09:00`;
}

/* ---------- 상품 · 원장 읽기 ---------- */

/** 공개 상품 — ids를 주면 그 상품만 (형식이 잘못된 id는 무시) · 행사 일시순 */
async function fetchProductRows(supabase: Supabase, ids?: string[]): Promise<ProductRow[]> {
  const validIds = ids?.filter((id) => UUID.test(id));
  if (validIds && validIds.length === 0) return [];

  let request = supabase
    .from("product")
    .select(PRODUCT_SELECT)
    .eq("status", PUBLIC_STATUS)
    .order("event_at", { ascending: true });
  if (validIds) request = request.in("id", validIds);

  const { data, error } = await request;
  if (error) throw new Error(`상품을 불러오지 못했어요: ${error.message}`);
  return data as ProductRow[];
}

async function fetchProductRow(supabase: Supabase, id: string) {
  const [row] = await fetchProductRows(supabase, [id]);
  return row ?? null;
}

/** 참여 인원 — 취소되지 않은 PAID 건수 (product_seat_counts) */
async function fetchSeats(supabase: Supabase, productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const { data, error } = await supabase.rpc("product_seat_counts", { product_ids: productIds });
  if (error) throw new Error(`참여 인원을 불러오지 못했어요: ${error.message}`);
  return new Map((data as { product_id: string; seats: number }[]).map((r) => [r.product_id, r.seats]));
}

/** 본인 결제 원장 — transaction_key(paymentId)별로 묶는다 */
async function fetchMyPayments(supabase: Supabase, userId: string, transactionKey?: string) {
  let request = supabase
    .from("payment")
    .select(PAYMENT_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (transactionKey) request = request.eq("transaction_key", transactionKey);

  const { data, error } = await request;
  if (error) throw new Error(`결제 내역을 불러오지 못했어요: ${error.message}`);

  const groups = new Map<string, PaymentRow[]>();
  for (const row of data as unknown as PaymentRow[]) {
    groups.set(row.transaction_key, [...(groups.get(row.transaction_key) ?? []), row]);
  }
  return groups;
}

/** 결제 1건의 현재 상태 — 같은 transaction_key의 행 중 가장 진행된 이벤트 */
function settle(events: PaymentRow[]) {
  const paid = events.find((e) => e.type === "PAID");
  const requested = events.find((e) => e.type === "CANCEL_REQUESTED");
  const cancelled = events.find((e) => e.type === "CANCELLED");
  const status: Exclude<OrderStatus, "failed"> = cancelled ? "refunded" : requested ? "refunding" : "paid";
  return { paid, requested, cancelled, status };
}

/** 본인이 결제 완료(취소 전)한 주문 — 상품 id별 */
function activeOrders(groups: Map<string, PaymentRow[]>) {
  const map = new Map<string, { id: string; paidAt: string }>();
  for (const [key, events] of groups) {
    const { paid, status } = settle(events);
    if (paid && status === "paid") map.set(paid.product_id, { id: key, paidAt: paidAtOf(paid) });
  }
  return map;
}

function paidAtOf(paid: PaymentRow) {
  const snapshot = paid.payment_snapshot?.snapshot_payment;
  return (snapshot && "paidAt" in snapshot && snapshot.paidAt) || paid.created_at;
}

/** 취소 요청 시각 — 취소 행 스냅샷의 포트원 cancellations[].requestedAt (없으면 원장 기록 시각) */
function cancelRequestedAtOf(row: PaymentRow) {
  const snapshot = row.payment_snapshot?.snapshot_payment;
  const cancellations = (snapshot && "cancellations" in snapshot && snapshot.cancellations) || [];
  const found = cancellations.find((c) => "requestedAt" in c && c.status !== "FAILED");
  return (found && "requestedAt" in found && found.requestedAt) || row.created_at;
}

/** 환불 완료 시각 — CANCELLED 행 스냅샷의 포트원 cancelledAt (웹훅이 늦게 와도 실제 시각) */
function refundedAtOf(row: PaymentRow) {
  const snapshot = row.payment_snapshot?.snapshot_payment;
  return (snapshot && "cancelledAt" in snapshot && snapshot.cancelledAt) || row.created_at;
}

function toProduct(
  row: ProductRow,
  now: number,
  seatsById: Map<string, number>,
  myOrders?: Map<string, { id: string; paidAt: string }>,
): Product {
  const maxSeats = row.capacity;
  const seats = Math.min(maxSeats, seatsById.get(row.id) ?? 0);
  return {
    id: row.id,
    title: row.name,
    description: row.description,
    bannerImage: { src: productImageUrl(row.image_path_main), alt: `${row.name} 배너` },
    photos: [{ src: productImageUrl(row.image_path_detail), alt: row.name }],
    startsAt: row.event_at,
    address: row.addresss,
    price: Number(row.price),
    maxSeats,
    seats,
    refundDeadline: refundDeadline(row.event_at),
    status: now >= Date.parse(row.event_at) ? "ended" : seats >= maxSeats ? "closed" : "on_sale",
    myOrder: myOrders?.get(row.id) ?? null,
  };
}

/** 원장 행 묶음 → 화면 주문. 상품 정보는 결제 시점 스냅샷을 쓴다 (이후 상품이 바뀌거나 비공개여도 그대로) */
function toOrder(key: string, events: PaymentRow[], now: number, seatsById: Map<string, number>): Order | null {
  const { paid, requested, cancelled, status } = settle(events);
  const snapshot = paid?.payment_snapshot;
  if (!paid || !snapshot) return null;

  const paidAt = paidAtOf(paid);
  const product = toProduct(
    snapshot.snapshot_product,
    now,
    seatsById,
    status === "paid" ? new Map([[paid.product_id, { id: key, paidAt }]]) : undefined,
  );
  return {
    id: key,
    orderNo: orderNumber(key, paidAt),
    product,
    amount: Number(paid.amount),
    method: paymentMethodLabel(snapshot.snapshot_payment),
    status,
    paidAt,
    canceledAt: requested ? cancelRequestedAtOf(requested) : cancelled ? cancelRequestedAtOf(cancelled) : undefined,
    refundedAt: cancelled ? refundedAtOf(cancelled) : undefined,
    attended: now >= Date.parse(product.endsAt ?? product.startsAt),
    cancelable: status === "paid" && now <= Date.parse(product.refundDeadline) && now < Date.parse(product.startsAt),
  };
}

async function toOrders(supabase: Supabase, groups: Map<string, PaymentRow[]>, now: number) {
  const productIds = [...new Set([...groups.values()].flat().map((e) => e.product_id))];
  const seats = await fetchSeats(supabase, productIds);
  return [...groups].flatMap(([key, events]) => {
    const order = toOrder(key, events, now, seats);
    return order ? [order] : [];
  });
}

/* ---------- 조회 ---------- */

/** 상품 목록 — 공개 상품 전체, 행사 일시순 */
export async function listProducts(userId?: string): Promise<Product[]> {
  await connection();
  const supabase = await createClient();
  const rows = await fetchProductRows(supabase);
  const [seats, mine] = await Promise.all([
    fetchSeats(
      supabase,
      rows.map((r) => r.id),
    ),
    userId ? fetchMyPayments(supabase, userId).then(activeOrders) : undefined,
  ]);
  const now = Date.now();
  return rows.map((row) => toProduct(row, now, seats, mine));
}

/** 메인 배너 — 판매 기간 안의 상품, 마감 상품은 뒤로 */
export async function listBannerProducts(userId?: string): Promise<Product[]> {
  const products = await listProducts(userId);
  return products
    .filter((p) => p.status !== "ended")
    .sort((a, b) => Number(a.status === "closed") - Number(b.status === "closed"));
}

/** 상품 상세 — 없거나 비공개거나 id 형식이 잘못되면 null */
export async function getProduct(id: string, userId?: string): Promise<Product | null> {
  if (!UUID.test(id)) return null;
  await connection();
  const supabase = await createClient();
  const row = await fetchProductRow(supabase, id);
  if (!row) return null;
  const [seats, mine] = await Promise.all([
    fetchSeats(supabase, [row.id]),
    userId ? fetchMyPayments(supabase, userId).then(activeOrders) : undefined,
  ]);
  return toProduct(row, Date.now(), seats, mine);
}

/** 결제 내역 — 결제 완료(취소 전) 주문, 최신 결제순 */
export async function listPayments(userId: string): Promise<Order[]> {
  await connection();
  const supabase = await createClient();
  const orders = await toOrders(supabase, await fetchMyPayments(supabase, userId), Date.now());
  return orders
    .filter((o) => o.status === "paid")
    .sort((a, b) => Date.parse(b.paidAt!) - Date.parse(a.paidAt!));
}

/** 취소 내역 — 환불 처리 중 · 완료, 최신 취소순 */
export async function listCancellations(userId: string): Promise<Order[]> {
  await connection();
  const supabase = await createClient();
  const orders = await toOrders(supabase, await fetchMyPayments(supabase, userId), Date.now());
  return orders
    .filter((o) => o.status === "refunding" || o.status === "refunded")
    .sort((a, b) => Date.parse(b.canceledAt!) - Date.parse(a.canceledAt!));
}

/** 본인 주문만 — id는 포트원 paymentId(transaction_key) */
export async function getOrder(id: string, userId: string): Promise<Order | null> {
  if (!UUID.test(id)) return null;
  await connection();
  const supabase = await createClient();
  const [order] = await toOrders(supabase, await fetchMyPayments(supabase, userId, id), Date.now());
  return order ?? null;
}

/* ---------- 결제 ---------- */

/** 판매 가능 여부 — 결제창 열기 전 · 결제 검증 시 같은 규칙 */
function saleError(product: Product): { status: number; error: OrderErrorBody } | null {
  if (product.myOrder) return { status: 409, error: { code: "ALREADY_PAID", message: "이미 결제한 모임이에요." } };
  if (product.status === "ended") {
    return { status: 409, error: { code: "ENDED", message: "판매가 끝난 모임이에요." } };
  }
  if (product.status === "closed") {
    return {
      status: 409,
      error: { code: "SOLD_OUT", message: "방금 마감되었어요. 결제는 진행되지 않았어요.", product },
    };
  }
  return null;
}

/**
 * 결제창 호출 정보 — 판매 가능 여부를 확인하고 금액 · 상품명 · paymentId · customData를 서버에서 정한다.
 * 원장에는 아무것도 기록하지 않는다 (결제 완료가 확인된 건만 기록).
 */
export async function preparePayment(
  userId: string,
  productId: string,
  origin: string,
): Promise<Result<PaymentRequestParams>> {
  const product = await getProduct(productId, userId);
  if (!product) return fail(404, { message: "상품을 찾을 수 없어요." });
  const blocked = saleError(product);
  if (blocked) return fail(blocked.status, blocked.error);

  const { storeId, channelKey } = getPortoneConfig();
  return {
    ok: true,
    value: {
      storeId,
      channelKey,
      paymentId: crypto.randomUUID(),
      orderName: product.title,
      totalAmount: product.price,
      currency: CURRENCY,
      payMethod: "CARD",
      redirectUrl: `${origin}/products/${product.id}/complete`,
      customData: { productId: product.id, userId },
    },
  };
}

function parseCustomData(payment: PortonePayment): { productId?: string; userId?: string } {
  const raw = "customData" in payment ? payment.customData : undefined;
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    return typeof data === "object" && data !== null ? (data as { productId?: string; userId?: string }) : {};
  } catch {
    return {};
  }
}

/** 검증에 실패한 결제는 즉시 전액 환불한다 — 원장에는 기록하지 않는다 */
async function refundUnrecorded(paymentId: string, amount: number, reason: string) {
  const result = await cancelPortonePayment(paymentId, { amount, reason, requester: "ADMIN" });
  if (!result.ok && !result.alreadyCancelled) {
    console.error(`[payment] 자동 환불 실패 — 포트원 콘솔에서 수동 취소 필요 paymentId=${paymentId}`, result.message);
  }
}

/**
 * 결제 완료 처리 (브라우저) — 포트원 결제 조회 API로 검증한 뒤 원장(PAID) + 스냅샷을 기록한다. 같은 paymentId로 다시 호출해도 안전(멱등).
 * 검증: 상점 · 결제자(customData.userId = 세션 사용자) · 이후는 recordPaidPayment
 */
export async function completePayment(userId: string, paymentId: string): Promise<Result<{ orderId: string }>> {
  if (!UUID.test(paymentId)) return fail(400, { message: "결제 정보가 올바르지 않아요." });
  await connection();
  const supabase = await createClient();

  // 이미 기록된 결제 — 새로고침 · 중복 요청 · 웹훅이 먼저 기록
  const recorded = await fetchMyPayments(supabase, userId, paymentId);
  if (recorded.size > 0) return { ok: true, value: { orderId: paymentId } };

  const payment = await getPortonePayment(paymentId);
  if (!payment) return fail(404, { message: "결제 내역을 찾을 수 없어요." });

  // 남의 결제 · 다른 상점 결제는 건드리지 않는다 (환불도 하지 않음)
  if (parseCustomData(payment).userId !== userId || !isOwnStore(payment)) {
    return fail(403, { message: "본인 결제만 확인할 수 있어요." });
  }
  return recordPaidPayment(supabase, paymentId, payment, userId, { withProduct: true });
}

/**
 * 결제 완료 동기화 (웹훅 Transaction.Paid) — 브라우저 complete 없이도 기록한다. 사용자 id는 customData.userId.
 * 세션이 없으므로 기록 여부만 service role로 확인하고(규칙 7절 예외), 상품은 anon(공개 상품 RLS)으로 읽는다.
 * 규칙: .claude/rules/payment.md 10-1절
 */
export async function syncPaidPayment(paymentId: string): Promise<Result<{ orderId: string }>> {
  if (!UUID.test(paymentId)) return fail(400, { message: "결제 정보가 올바르지 않아요." });
  await connection();

  // 이미 기록된 결제는 다시 검증하지 않는다 — 기록 후 가격 변경 · 행사 시작으로 정상 결제가 환불되지 않게
  const ledger = await fetchLedger(paymentId);
  if (ledger.some((row) => row.type === "PAID")) return { ok: true, value: { orderId: paymentId } };

  const payment = await getPortonePayment(paymentId);
  if (!payment) return fail(404, { message: "결제 내역을 찾을 수 없어요." });

  const { userId } = parseCustomData(payment);
  if (!isOwnStore(payment) || !userId || !UUID.test(userId)) {
    return fail(403, { message: "이 상점의 결제가 아니거나 결제자 정보가 없어요." });
  }
  // 세션 없는 요청 — createClient()는 anon으로 동작한다 (공개 상품만 조회)
  const supabase = await createClient();
  return recordPaidPayment(supabase, paymentId, payment, userId, { withProduct: false });
}

function isOwnStore(payment: PortonePayment) {
  return !("storeId" in payment) || payment.storeId === getPortoneConfig().storeId;
}

interface LedgerRow {
  type: PaymentType;
  amount: number | string;
  user_id: string;
  product_id: string;
  payment_snapshot: { snapshot_product: ProductRow } | null;
}

/** 결제 1건의 원장 행 — 웹훅 전용 (세션이 없어 service role로 필요한 컬럼만 읽는다 · 규칙 8절 예외) */
async function fetchLedger(paymentId: string): Promise<LedgerRow[]> {
  const { data, error } = await createAdminClient()
    .from("payment")
    .select("type, amount, user_id, product_id, payment_snapshot(snapshot_product)")
    .eq("transaction_key", paymentId);
  if (error) throw new Error(`결제 원장을 불러오지 못했어요: ${error.message}`);
  return data as unknown as LedgerRow[];
}

/**
 * 결제 검증 + 원장 기록 — 브라우저 complete · 웹훅이 공유한다 (규칙 4절 5~7번).
 * 상태 PAID · 공개 상품 · 통화 · 금액 = 현재 상품가 · 판매 기간 · 정원 · 중복 결제. 상태 외 실패는 즉시 전액 자동 환불.
 * withProduct: SOLD_OUT 응답에 최신 상품을 담을지 (세션이 있는 브라우저 요청만 — 참여 인원 조회에 로그인이 필요하다)
 */
async function recordPaidPayment(
  supabase: Supabase,
  paymentId: string,
  payment: PortonePayment,
  userId: string,
  { withProduct }: { withProduct: boolean },
): Promise<Result<{ orderId: string }>> {
  if (payment.status !== "PAID") {
    return fail(400, { code: "PAYMENT_NOT_PAID", message: "결제가 완료되지 않았어요." });
  }

  const paidAmount = payment.amount.total;
  const refund = async (status: number, error: OrderErrorBody, reason: string) => {
    await refundUnrecorded(paymentId, paidAmount, reason);
    return fail(status, error);
  };

  const { productId } = parseCustomData(payment);
  const row = productId ? await fetchProductRow(supabase, productId) : null;
  if (!row) {
    return refund(
      409,
      { code: "VERIFICATION_FAILED", message: "판매 중인 모임이 아니에요. 결제는 자동으로 취소돼요." },
      "판매 중이 아닌 상품",
    );
  }
  if (payment.currency !== CURRENCY || paidAmount !== Number(row.price)) {
    return refund(
      400,
      { code: "VERIFICATION_FAILED", message: "결제 금액이 상품 가격과 달라요. 결제는 자동으로 취소돼요." },
      "결제 금액 불일치",
    );
  }
  if (Date.now() >= Date.parse(row.event_at)) {
    return refund(409, { code: "ENDED", message: "판매가 끝난 모임이에요. 결제는 자동으로 취소돼요." }, "판매 종료");
  }

  const { data: outcome, error } = await createAdminClient().rpc("record_payment_paid", {
    p_transaction_key: paymentId,
    p_user_id: userId,
    p_product_id: row.id,
    p_amount: paidAmount,
    p_snapshot_payment: payment,
    p_snapshot_product: row,
  });
  if (error) {
    // 돈은 나갔는데 기록 실패 — 환불하지 않고 재시도(complete 재호출 · 웹훅 재전송)로 복구한다
    console.error(`[payment] 원장 기록 실패 paymentId=${paymentId}`, error.message);
    return fail(500, { message: "결제는 되었지만 확인이 늦어지고 있어요. 잠시 후 다시 시도해주세요." });
  }

  switch (outcome as string) {
    case "RECORDED":
    case "ALREADY_RECORDED":
      return { ok: true, value: { orderId: paymentId } };
    case "DUPLICATE":
      return refund(
        409,
        { code: "ALREADY_PAID", message: "이미 결제한 모임이에요. 이번 결제는 자동으로 취소돼요." },
        "중복 결제",
      );
    case "SOLD_OUT": {
      const product = withProduct ? await getProduct(row.id, userId) : null;
      return refund(
        409,
        {
          code: "SOLD_OUT",
          message: "방금 마감되었어요. 결제는 자동으로 취소돼요.",
          ...(product ? { product } : {}),
        },
        "정원 마감",
      );
    }
    default:
      return refund(
        409,
        { code: "VERIFICATION_FAILED", message: "판매 중인 모임이 아니에요. 결제는 자동으로 취소돼요." },
        "판매 중이 아닌 상품",
      );
  }
}

/* ---------- 결제 취소 ---------- */

/**
 * 고객 결제 취소 — 본인 결제 · 환불 가능 기간(행사 3일 전 23:59 KST)까지 전액 환불.
 * 포트원 취소 성공 후 원장에 CANCELLED(즉시 완료) 또는 CANCEL_REQUESTED(PG 비동기) 행을 추가한다.
 */
export async function cancelPayment(userId: string, paymentId: string): Promise<Result<Order>> {
  if (!UUID.test(paymentId)) return fail(404, { message: "결제 내역을 찾을 수 없어요." });
  await connection();
  const supabase = await createClient();
  const now = Date.now();

  const groups = await fetchMyPayments(supabase, userId, paymentId);
  const events = groups.get(paymentId);
  const order = events ? toOrder(paymentId, events, now, new Map()) : null;
  if (!events || !order) return fail(404, { message: "결제 내역을 찾을 수 없어요." });
  if (!order.cancelable) {
    return fail(409, { code: "NOT_CANCELABLE", message: "취소할 수 있는 기간이 지났어요." });
  }

  const result = await cancelPortonePayment(paymentId, {
    amount: order.amount,
    reason: "고객 요청 취소",
    requester: "CUSTOMER",
  });
  if (!result.ok && !result.alreadyCancelled) return fail(502, { message: result.message });

  // 취소 이후 상태를 다시 조회해 스냅샷으로 남긴다 (취소 내역 cancellations 포함)
  const latest = await getPortonePayment(paymentId);
  const type: CancelType = result.ok && result.status === "REQUESTED" ? "CANCEL_REQUESTED" : "CANCELLED";
  const paidSnapshot = events.find((e) => e.type === "PAID")!.payment_snapshot!;

  const recorded = await recordCancel(supabase, paymentId, type, latest ?? paidSnapshot.snapshot_payment, {
    userId,
    productId: order.product.id,
    amount: order.amount,
    snapshotProduct: paidSnapshot.snapshot_product,
  });
  if (!recorded.ok) {
    console.error(`[payment] 취소 원장 기록 실패 — 포트원은 취소됨 paymentId=${paymentId}`, recorded.message);
    return fail(500, { message: "취소는 접수됐지만 내역 반영이 늦어지고 있어요. 잠시 후 확인해주세요." });
  }

  const [updated] = await toOrders(supabase, await fetchMyPayments(supabase, userId, paymentId), Date.now());
  return { ok: true, value: updated ?? order };
}

type CancelType = Extract<PaymentType, "CANCEL_REQUESTED" | "CANCELLED">;

/**
 * 취소 원장 기록 — 고객 취소 · 취소 웹훅 공용. 금액은 −PAID 금액(전액 취소), 스냅샷 상품은 현재 상품(비공개면 PAID 스냅샷 상품).
 * record_payment_cancel이 PAID 행을 잠그고 ALREADY_RECORDED를 판정하므로 동시에 와도 1행만 기록된다.
 */
async function recordCancel(
  supabase: Supabase,
  paymentId: string,
  type: CancelType,
  snapshotPayment: PortonePayment,
  paid: { userId: string; productId: string; amount: number; snapshotProduct: ProductRow },
): Promise<{ ok: true; outcome: string } | { ok: false; message: string }> {
  const currentProduct = await fetchProductRow(supabase, paid.productId);
  const { data, error } = await createAdminClient().rpc("record_payment_cancel", {
    p_transaction_key: paymentId,
    p_user_id: paid.userId,
    p_type: type,
    // 원장 부호: 취소 행은 − (전액 취소 = −PAID 금액)
    p_amount: -paid.amount,
    p_snapshot_payment: snapshotPayment,
    p_snapshot_product: currentProduct ?? paid.snapshotProduct,
  });
  if (error) return { ok: false, message: error.message };
  if (data === "NOT_FOUND") return { ok: false, message: "원장에 PAID 행이 없어요." };
  return { ok: true, outcome: data as string };
}

/** 포트원 결제 조회 응답 → 원장 취소 타입. 부분 취소(금액 불일치)는 PARTIAL, 취소 흔적이 없으면 null */
function cancelTypeOf(payment: PortonePayment, paidAmount: number): CancelType | "PARTIAL" | null {
  if (payment.status === "CANCELLED") return payment.amount.cancelled === paidAmount ? "CANCELLED" : "PARTIAL";
  if (payment.status === "PARTIAL_CANCELLED") return "PARTIAL";
  if (payment.status === "PAID") {
    const requested = payment.cancellations?.find((c) => c.status === "REQUESTED");
    if (!requested) return null;
    return "totalAmount" in requested && requested.totalAmount === paidAmount ? "CANCEL_REQUESTED" : "PARTIAL";
  }
  return null;
}

/**
 * 결제 취소 동기화 (웹훅 Transaction.CancelPending · Cancelled · PartialCancelled) — 규칙: .claude/rules/payment.md 11-1절
 * 콘솔 운영자 취소 · PG 비동기 취소 완료를 원장에 반영한다. 웹훅 type이 아니라 결제 조회 응답으로 판단한다.
 */
export async function syncCancelledPayment(paymentId: string): Promise<Result<{ orderId: string }>> {
  if (!UUID.test(paymentId)) return fail(400, { message: "결제 정보가 올바르지 않아요." });
  await connection();

  const ledger = await fetchLedger(paymentId);
  const paid = ledger.find((row) => row.type === "PAID");
  // 원장에 없는 결제 — 검증 실패로 자동 환불된 미기록 결제
  if (!paid?.payment_snapshot) return fail(404, { message: "원장에 없는 결제예요." });
  if (ledger.some((row) => row.type === "CANCELLED")) return { ok: true, value: { orderId: paymentId } };

  const payment = await getPortonePayment(paymentId);
  if (!payment) return fail(404, { message: "결제 내역을 찾을 수 없어요." });
  if (!isOwnStore(payment)) return fail(403, { message: "이 상점의 결제가 아니에요." });

  const paidAmount = Number(paid.amount);
  const type = cancelTypeOf(payment, paidAmount);
  if (type === "PARTIAL") {
    console.error(`[payment] 부분 취소 — 원장 미반영, 포트원 콘솔 확인 필요 paymentId=${paymentId}`);
    return fail(409, { message: "부분 취소는 지원하지 않아요." });
  }
  if (!type) return fail(409, { message: "취소된 결제가 아니에요." });

  // 세션 없는 요청 — createClient()는 anon으로 동작한다 (공개 상품만 조회)
  const supabase = await createClient();
  const recorded = await recordCancel(supabase, paymentId, type, payment, {
    userId: paid.user_id,
    productId: paid.product_id,
    amount: paidAmount,
    snapshotProduct: paid.payment_snapshot.snapshot_product,
  });
  if (!recorded.ok) {
    console.error(`[payment] 취소 원장 기록 실패 paymentId=${paymentId}`, recorded.message);
    return fail(500, { message: "취소 내역을 기록하지 못했어요." });
  }
  return { ok: true, value: { orderId: paymentId } };
}
