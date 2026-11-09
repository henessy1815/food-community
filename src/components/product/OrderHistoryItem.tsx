import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/foundations/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  REFUND_DAYS,
  formatDate,
  formatDotDate,
  formatMonthDay,
  formatPrice,
  regionLabel,
  shortWhen,
  type Order,
} from "@/lib/products";

function Thumb({ order, size }: { order: Order; size: 52 | 64 }) {
  return (
    <Image
      src={order.product.photos[0].src}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-[14px] object-cover", size === 64 ? "size-[64px]" : "size-[52px]")}
    />
  );
}

/** 결제 내역 한 건 — 상품을 누르면 상세로 · 환불 기간 안이면 결제 취소 */
export function PaymentHistoryItem({
  order,
  onCancel,
  className,
}: {
  order: Order;
  onCancel?: (order: Order) => void;
  className?: string;
}) {
  const p = order.product;
  return (
    <article className={cn("flex flex-col gap-(--spacing-12) py-(--spacing-16)", className)}>
      <div className="flex items-center justify-between">
        {order.attended ? <Badge>참여 완료</Badge> : <Badge type="success">결제 완료</Badge>}
        {order.paidAt && <span className="label-md text-text-tertiary">{formatDate(order.paidAt)} 결제</span>}
      </div>

      <Link
        href={`/products/${p.id}`}
        className="flex items-center gap-(--spacing-12) rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-brand"
      >
        <Thumb order={order} size={64} />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <h3 className="heading-sm text-text-default">{p.title}</h3>
          <p className="label-md text-text-secondary">
            {shortWhen(p)} · {regionLabel(p)}
          </p>
          <p className="label-lg text-text-default">{formatPrice(order.amount)}</p>
        </div>
        <Icon name="chevron-right" size={16} className="text-text-tertiary" />
      </Link>

      {!order.attended && (
        <div className="flex items-center justify-between gap-(--spacing-8)">
          {order.cancelable ? (
            <p className="label-md text-text-success">{formatMonthDay(p.refundDeadline)}까지 전액 환불 가능</p>
          ) : (
            <p className="flex min-w-0 flex-1 items-center gap-[4px] label-md text-text-warning">
              <Icon name="warning" size={16} />
              행사 {REFUND_DAYS}일 전까지만 취소할 수 있어요
            </p>
          )}
          <Button
            variant="secondary"
            size="sm"
            disabled={!order.cancelable}
            onClick={() => onCancel?.(order)}
          >
            결제 취소
          </Button>
        </div>
      )}
    </article>
  );
}

/** 취소 내역 한 건 — 환불 처리 중 · 환불 완료 */
export function CancelHistoryItem({ order, className }: { order: Order; className?: string }) {
  const p = order.product;
  const refunded = order.status === "refunded";
  return (
    <article className={cn("flex flex-col gap-(--spacing-12) py-(--spacing-16)", className)}>
      <div className="flex items-center justify-between">
        {refunded ? <Badge type="success">환불 완료</Badge> : <Badge type="warning">환불 처리 중</Badge>}
        {order.canceledAt && <span className="label-md text-text-tertiary">{formatDate(order.canceledAt)} 취소</span>}
      </div>

      <div className="flex items-center gap-(--spacing-12)">
        <Thumb order={order} size={52} />
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <h3 className="heading-sm text-text-default">{p.title}</h3>
          <p className="label-md text-text-secondary">
            {shortWhen(p)} · {regionLabel(p)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-(--spacing-8) rounded-[14px] bg-background-subtle p-(--spacing-12)">
        <dl className="contents">
          <div className="flex items-center justify-between">
            <dt className="body-md text-text-secondary">결제 금액</dt>
            <dd className="body-md text-text-secondary">{formatPrice(order.amount)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="body-md text-text-secondary">환불 금액</dt>
            <dd className="label-lg text-text-default">{formatPrice(order.amount)}</dd>
          </div>
        </dl>
        <p className="label-md text-text-tertiary">
          {refunded && order.refundedAt
            ? `${formatDotDate(order.refundedAt)} 환불이 완료됐어요`
            : "결제한 카드로 3~5영업일 안에 들어와요"}
        </p>
      </div>
    </article>
  );
}
