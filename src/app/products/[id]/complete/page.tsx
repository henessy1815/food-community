import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PaymentConfirm } from "@/components/product/PaymentConfirm";
import { OrderResultScreen } from "@/components/screens/OrderResultScreen";
import { Spinner } from "@/components/ui/Spinner";
import { getCurrentUser } from "@/lib/auth";
import { failedOrder } from "@/lib/products";
import { getProduct } from "@/lib/shop";

export const metadata: Metadata = { title: "결제 확인 · 구로 맛길" };

/**
 * 결제 완료 페이지 — 포트원 결제창의 redirectUrl
 * 쿼리: paymentId (공통) · code · message (실패 시). 성공이면 서버 검증 후 /orders/[paymentId]로 이동한다.
 */
export default function PaymentCompletePage({ params, searchParams }: PageProps<"/products/[id]/complete">) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      {Promise.all([params, searchParams]).then(([{ id }, query]) => (
        <Complete
          id={id}
          paymentId={first(query.paymentId)}
          code={first(query.code)}
          message={first(query.message)}
        />
      ))}
    </Suspense>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Complete({
  id,
  paymentId,
  code,
  message,
}: {
  id: string;
  paymentId?: string;
  code?: string;
  message?: string;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/products/${id}`);
  const product = await getProduct(id, user.id);

  // 결제창에서 실패 · 취소 — 결제되지 않았으므로 서버 검증 없이 실패 화면
  if (code !== undefined || !paymentId) {
    if (!product) redirect("/");
    return <OrderResultScreen order={failedOrder(product, paymentId ?? "--------", message ?? "결제가 중단되었어요")} />;
  }
  return <PaymentConfirm paymentId={paymentId} product={product} />;
}
