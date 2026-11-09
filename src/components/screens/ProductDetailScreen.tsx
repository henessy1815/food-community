"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/foundations/Icon";
import { BottomBar, SectionDivider } from "@/components/layout/BottomBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { PaymentSheet } from "@/components/product/PaymentSheet";
import { PhotoCarousel } from "@/components/restaurant/PhotoCarousel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import {
  REFUND_DAYS,
  formatPrice,
  formatShortDate,
  fullWhen,
  remainingSeats,
  type OrderErrorBody,
  type PaymentRequestParams,
  type Product,
} from "@/lib/products";

const sectionClass = "flex flex-col px-(--spacing-16) md:px-(--spacing-24)";

/** 배너 상세(상품 상세) — 판매 중 · 모집 마감 · 판매 종료 · 참여 예정 */
export function ProductDetailScreen({ product: initial }: { product: Product }) {
  const router = useRouter();
  const [product, setProduct] = useState(initial);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const p = product;
  const remaining = remainingSeats(p);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  // 시트를 열 때 참여 인원을 최신 숫자로 다시 불러온다
  const openSheet = async () => {
    setSheetOpen(true);
    try {
      const res = await fetch(`/api/products/${p.id}`, { cache: "no-store" });
      if (res.ok) setProduct((await res.json()) as Product);
    } catch {
      // 네트워크 오류면 기존 숫자로 진행 — 결제 직전에 서버가 다시 확인한다
    }
  };

  // 결제 — 서버가 정한 결제 정보로 포트원 결제창을 연다. 결과는 redirectUrl(/products/[id]/complete)에서 서버가 검증한다
  const pay = async () => {
    if (paying) return;
    setPaying(true);
    try {
      const res = await fetch("/api/payments/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id }),
      });
      if (!res.ok) {
        const error = (await res.json()) as OrderErrorBody;
        if (error.product) setProduct(error.product);
        if (error.code === "ALREADY_PAID") {
          setSheetOpen(false);
          router.refresh();
        }
        setToast({ type: "error", message: error.message });
        setPaying(false);
        return;
      }

      const params = (await res.json()) as PaymentRequestParams;
      const PortOne = await import("@portone/browser-sdk/v2");
      // forceRedirect: PC · 모바일 모두 결제 결과를 redirectUrl 쿼리(paymentId · code · message)로 받는다
      const response = await PortOne.requestPayment({ ...params, forceRedirect: true });
      // 여기로 돌아오면 결제창이 뜨기 전에 실패한 경우
      if (response?.code !== undefined) {
        setToast({ type: "error", message: response.message ?? "결제를 시작하지 못했어요." });
      } else if (response) {
        router.replace(`/products/${p.id}/complete?paymentId=${encodeURIComponent(response.paymentId)}`);
        return;
      }
    } catch {
      setToast({ type: "error", message: "결제를 시작하지 못했어요. 잠시 후 다시 시도해주세요." });
    }
    setPaying(false);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) return await navigator.share({ title: p.title, url });
      await navigator.clipboard.writeText(url);
      setToast({ type: "success", message: "링크를 복사했어요" });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setToast({ type: "error", message: "링크를 복사하지 못했어요" });
    }
  };

  const viewTerms = () => {
    setSheetOpen(false);
    document.getElementById("refund-policy")?.scrollIntoView({ behavior: "smooth" });
  };

  const status =
    p.status === "closed"
      ? { type: "error" as const, label: "모집 마감" }
      : p.status === "ended"
        ? { type: "neutral" as const, label: "판매 종료" }
        : { type: "success" as const, label: "모집 중" };

  const keyInfo: { icon: IconName; label: string; value: string }[] = [
    { icon: "calendar", label: "일시", value: fullWhen(p) },
    { icon: "map-pin", label: "모이는 곳", value: p.address },
    ...(p.parking ? [{ icon: "car" as const, label: "주차", value: p.parking }] : []),
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader back size="narrow" rightActions={[{ icon: "share", label: "공유하기", onClick: share }]} />

      <main className="mx-auto w-full max-w-[640px] flex-1">
        <PhotoCarousel photos={p.photos} label="모임 사진" />

        <div className={`${sectionClass} gap-(--spacing-20) pt-(--spacing-16) pb-(--spacing-24)`}>
          <div className="flex flex-col gap-(--spacing-8)">
            <div className="flex gap-[6px]">
              {p.category && <Badge>{p.category}</Badge>}
              <Badge type={status.type}>{status.label}</Badge>
            </div>
            <h1 className="heading-lg text-text-default">{p.title}</h1>
            {p.summary && <p className="body-md text-text-secondary">{p.summary}</p>}
            <p className="flex items-end gap-[4px]">
              <span className="display-sm text-text-default">{formatPrice(p.price)}</span>
              <span className="body-md text-text-tertiary">/ 1인</span>
            </p>
          </div>

          <hr className="border-border-default" />

          <dl className="flex flex-col gap-(--spacing-12)">
            {keyInfo.map((row) => (
              <div key={row.label} className="flex gap-(--spacing-12)">
                <Icon name={row.icon} size={20} className="text-text-tertiary" />
                <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <dt className="label-md text-text-tertiary">{row.label}</dt>
                  <dd className="label-lg text-text-default">{row.value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-(--spacing-8) rounded-[14px] bg-background-subtle p-(--spacing-16)">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-[6px] label-lg text-text-default">
                <Icon name="user" size={20} />
                참여 인원
              </p>
              <p className="flex items-end gap-[2px]">
                <span className="heading-md text-text-brand">{p.seats}</span>
                <span className="body-md text-text-secondary">/ {p.maxSeats}명</span>
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="참여 인원"
              aria-valuemin={0}
              aria-valuemax={p.maxSeats}
              aria-valuenow={p.seats}
              className="h-[6px] overflow-hidden rounded-[3px] bg-background-strong"
            >
              <div
                className="h-full rounded-[3px] bg-background-brand"
                style={{ width: `${(p.seats / p.maxSeats) * 100}%` }}
              />
            </div>
            <p className="label-md text-text-secondary">
              {remaining > 0
                ? `${remaining}자리 남았어요 · 결제 순서대로 자리가 확정돼요`
                : "정원이 모두 찼어요 · 취소 자리가 생기면 다시 열려요"}
            </p>
          </div>
        </div>

        <SectionDivider />

        <section aria-labelledby="about-title" className={`${sectionClass} gap-(--spacing-16) py-(--spacing-24)`}>
          <h2 id="about-title" className="heading-sm text-text-default">
            모임 소개
          </h2>
          <p className="body-lg whitespace-pre-line text-text-body">{p.description}</p>
          {!!p.schedule?.length && (
            <div className="flex flex-col gap-(--spacing-12) rounded-[14px] border border-border-default p-(--spacing-16)">
              <h3 className="label-lg text-text-default">진행 순서</h3>
              <ol className="flex flex-col gap-(--spacing-12)">
                {p.schedule.map((step) => (
                  <li key={step.time} className="flex gap-(--spacing-12)">
                    <span className="w-[44px] shrink-0 label-lg text-text-brand-strong">{step.time}</span>
                    <span className="min-w-0 flex-1 body-md text-text-body">{step.description}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {!!p.includes?.length && (
            <ul className="flex flex-col gap-[6px]">
              {p.includes.map((text) => (
                <li key={text} className="flex gap-[6px]">
                  <Icon name="check" size={16} className="mt-[2px] text-text-success" />
                  <span className="min-w-0 flex-1 body-md text-text-body">{text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <SectionDivider />

        <section
          id="refund-policy"
          aria-labelledby="refund-title"
          className={`${sectionClass} scroll-mt-[64px] gap-(--spacing-12) py-(--spacing-24)`}
        >
          <h2 id="refund-title" className="heading-sm text-text-default">
            환불 규정
          </h2>
          <dl className="flex flex-col rounded-[14px] border border-border-default">
            <div className="flex items-center justify-between px-(--spacing-16) py-(--spacing-12)">
              <dt className="body-md text-text-body">
                행사 {REFUND_DAYS}일 전 ({formatShortDate(p.refundDeadline)}
                )까지
              </dt>
              <dd className="label-lg text-text-success">전액 환불</dd>
            </div>
            <div className="flex items-center justify-between border-t border-border-default px-(--spacing-16) py-(--spacing-12)">
              <dt className="body-md text-text-body">행사 {REFUND_DAYS - 1}일 전부터</dt>
              <dd className="label-lg text-text-error">취소 불가</dd>
            </div>
          </dl>
          <p className="flex gap-[6px] label-md text-text-secondary">
            <Icon name="info" size={16} className="text-text-tertiary" />
            <span className="min-w-0 flex-1">
              취소는 마이 페이지 › 결제 내역에서 할 수 있어요. 환불은 결제 수단으로 3~5영업일 안에 들어와요.
            </span>
          </p>
        </section>

        <footer className={`${sectionClass} gap-[4px] bg-background-subtle pt-(--spacing-20) pb-(--spacing-32)`}>
          <h2 className="label-lg text-text-secondary">판매자 정보</h2>
          <p className="label-md whitespace-pre-line text-text-tertiary">
            {`상호 구로맛길 · 대표 ○○○ · 사업자등록번호 000-00-00000\n통신판매업 신고 제2026-서울구로-0000호 · 서울 구로구 ○○로 00\n고객센터 help@guromatgil.kr`}
          </p>
          <p className="flex gap-(--spacing-12) label-md text-text-secondary">
            <span>이용약관</span>
            <a href="#refund-policy">환불 규정</a>
            <span>개인정보처리방침</span>
          </p>
        </footer>
      </main>

      <BottomBar direction="row">
        {p.myOrder ? (
          <>
            <div className="flex shrink-0 flex-col gap-[2px]">
              <span className="label-md text-text-tertiary">{formatShortDate(p.myOrder.paidAt)} 결제 완료</span>
              <Link
                href="/mypage?tab=payments"
                className="flex items-center gap-[2px] label-lg text-text-brand-strong focus-visible:outline-2 focus-visible:outline-border-brand"
              >
                결제 내역 보기
                <Icon name="chevron-right" size={16} />
              </Link>
            </div>
            <Button size="lg" disabled iconLeft="check" className="flex-1">
              참여 예정
            </Button>
          </>
        ) : (
          <>
            <div className="flex shrink-0 flex-col">
              <span className="label-md text-text-tertiary">1인 결제 금액</span>
              <span className="heading-md text-text-default">{formatPrice(p.price)}</span>
            </div>
            <Button size="lg" disabled={p.status !== "on_sale"} className="flex-1" onClick={openSheet}>
              {p.status === "closed" ? "모집 마감" : p.status === "ended" ? "판매 종료" : "결제하기"}
            </Button>
          </>
        )}
      </BottomBar>

      <PaymentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        product={p}
        onPay={pay}
        paying={paying}
        onViewTerms={viewTerms}
      />

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-[64px] z-[60] flex justify-center px-(--spacing-16)">
          <Toast type={toast.type}>{toast.message}</Toast>
        </div>
      )}
    </div>
  );
}
