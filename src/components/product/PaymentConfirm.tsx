"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OrderResultScreen } from "@/components/screens/OrderResultScreen";
import { Empty } from "@/components/ui/Empty";
import { Spinner } from "@/components/ui/Spinner";
import { failedOrder, type OrderErrorBody, type PaymentCompletedBody, type Product } from "@/lib/products";

/** 결제되지 않았거나 자동 환불된 경우 — 결제 실패 화면으로 보여준다 */
const NOT_CHARGED: OrderErrorBody["code"][] = ["PAYMENT_NOT_PAID", "VERIFICATION_FAILED", "SOLD_OUT", "ENDED", "ALREADY_PAID"];

/**
 * 결제창에서 돌아온 뒤 서버 검증 — POST /api/payments/complete 성공 시 결제 결과(/orders/[paymentId])로 이동.
 * 서버 처리는 멱등이라 새로고침해도 결제가 두 번 기록되지 않는다.
 */
export function PaymentConfirm({ paymentId, product }: { paymentId: string; product: Product | null }) {
  const router = useRouter();
  const [failure, setFailure] = useState<{ message: string; charged: boolean } | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // 개발 모드 StrictMode의 effect 이중 실행에도 요청은 한 번만
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetch("/api/payments/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });
        if (res.ok) {
          const { orderId } = (await res.json()) as PaymentCompletedBody;
          router.replace(`/orders/${orderId}`);
          return;
        }
        const error = (await res.json()) as OrderErrorBody;
        setFailure({ message: error.message, charged: !NOT_CHARGED.includes(error.code) });
      } catch {
        setFailure({ message: "결제를 확인하지 못했어요. 새로고침하면 다시 확인해요.", charged: true });
      }
    })();
  }, [paymentId, router]);

  if (failure && !failure.charged && product) {
    return <OrderResultScreen order={failedOrder(product, paymentId, failure.message)} />;
  }
  if (failure) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Empty
          visual="warning"
          title="결제를 확인하지 못했어요"
          description={failure.message}
          primaryAction={{ label: "다시 확인", icon: "refresh", onClick: () => window.location.reload() }}
          secondaryAction={{ label: "결제 내역 보기", onClick: () => router.push("/mypage?tab=payments") }}
        />
      </div>
    );
  }
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-(--spacing-12)">
      <Spinner />
      <p className="body-md text-text-secondary">결제를 확인하고 있어요</p>
    </div>
  );
}
