"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/foundations/Icon";
import { BottomBar } from "@/components/layout/BottomBar";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatMonthDay, formatPrice, meetingGreeting, shortWhen, type Order } from "@/lib/products";

interface ReceiptRow {
  label: string;
  value: ReactNode;
  valueClass?: string;
}

/** 결제 결과 — 결제 완료 · 결제 실패 */
export function OrderResultScreen({ order }: { order: Order }) {
  const router = useRouter();
  const p = order.product;
  const failed = order.status === "failed";

  const rows: ReceiptRow[] = failed
    ? [
        { label: "실패 사유", value: order.failReason ?? "결제가 중단되었어요", valueClass: "label-lg text-text-error" },
        { label: "주문번호", value: order.orderNo },
        { label: "결제 금액", value: "0원 (청구되지 않음)" },
      ]
    : [
        { label: "일시", value: shortWhen(p) },
        { label: "모이는 곳", value: p.address },
        { label: "결제 수단", value: order.method },
        { label: "주문번호", value: order.orderNo },
        { label: "결제 금액", value: formatPrice(order.amount), valueClass: "heading-sm text-text-brand-strong" },
      ];

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="결제 결과" size="narrow" />

      <Container size="narrow" as="main" className="flex flex-1 flex-col gap-(--spacing-24) py-(--spacing-24)">
        <div className="flex flex-col items-center gap-(--spacing-12) text-center">
          <span
            className={cn(
              "flex size-[64px] items-center justify-center rounded-full",
              failed ? "bg-background-error-subtle text-text-error" : "bg-background-success-subtle text-text-success",
            )}
          >
            <Icon name={failed ? "error" : "check-circle"} size={32} />
          </span>
          <div className="flex flex-col gap-[6px]">
            <h1 className="heading-lg text-text-default">{failed ? "결제가 완료되지 않았어요" : "결제가 완료되었어요"}</h1>
            <p className="body-md text-text-secondary">
              {failed ? "결제 중 문제가 생겨 결제가 진행되지 않았어요." : meetingGreeting(p)}
            </p>
          </div>
        </div>

        <section aria-label="결제 정보" className="overflow-hidden rounded-[14px] border border-border-default">
          <div className="flex items-center gap-(--spacing-12) p-(--spacing-16)">
            <Image
              src={p.photos[0].src}
              alt=""
              width={52}
              height={52}
              className="size-[52px] shrink-0 rounded-[14px] object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
              {p.category && <p className="label-md text-text-brand-strong">{p.category}</p>}
              <p className="heading-sm text-text-default">{p.title}</p>
            </div>
          </div>
          <dl className="flex flex-col gap-(--spacing-12) bg-background-subtle p-(--spacing-16)">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-(--spacing-12)">
                <dt className="shrink-0 body-md text-text-secondary">{row.label}</dt>
                <dd className={cn("text-right", row.valueClass ?? "label-lg text-text-default")}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p
          className={cn(
            "flex gap-[6px] rounded-[14px] p-(--spacing-12)",
            failed ? "bg-background-warning-subtle" : "bg-background-info-subtle",
          )}
        >
          <Icon
            name={failed ? "warning" : "info"}
            size={16}
            className={cn("mt-[1px]", failed ? "text-text-warning" : "text-text-info")}
          />
          <span className="min-w-0 flex-1 label-md text-text-body">
            {failed
              ? "결제되지 않았으니 요금은 청구되지 않아요. 남은 자리가 있으면 바로 다시 결제할 수 있어요."
              : `${formatMonthDay(p.refundDeadline)}까지 마이 페이지 › 결제 내역에서 취소하면 전액 환불돼요.`}
          </span>
        </p>
      </Container>

      <BottomBar bordered={false}>
        <div className="flex w-full gap-(--spacing-8)">
          {failed ? (
            <>
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => router.push("/")}>
                메인으로
              </Button>
              <Button
                size="lg"
                iconLeft="refresh"
                className="flex-1"
                onClick={() => router.replace(`/products/${p.id}`)}
              >
                다시 시도
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => router.push("/mypage?tab=payments")}
              >
                결제 내역 보기
              </Button>
              <Button size="lg" className="flex-1" onClick={() => router.push("/")}>
                메인으로
              </Button>
            </>
          )}
        </div>
      </BottomBar>
    </div>
  );
}
