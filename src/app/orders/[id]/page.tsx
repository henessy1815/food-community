import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { OrderResultScreen } from "@/components/screens/OrderResultScreen";
import { Spinner } from "@/components/ui/Spinner";
import { getCurrentUser } from "@/lib/auth";
import { getOrder } from "@/lib/shop";

export const metadata: Metadata = { title: "결제 결과 · 구로 맛길" };

/** 결제 결과 — 저장된 주문을 보여주기만 하므로 새로고침·뒤로 가기로 결제가 다시 일어나지 않는다 */
export default function OrderResultPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      {params.then(({ id }) => (
        <Result id={id} />
      ))}
    </Suspense>
  );
}

async function Result({ id }: { id: string }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/orders/${id}`);
  const order = await getOrder(id, user.id);
  if (!order) notFound();
  return <OrderResultScreen order={order} />;
}
