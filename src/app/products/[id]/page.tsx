import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductDetailScreen } from "@/components/screens/ProductDetailScreen";
import { Spinner } from "@/components/ui/Spinner";
import { getCurrentUser } from "@/lib/auth";
import { getProduct } from "@/lib/shop";

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product ? `${product.title} · 구로 맛길` : "구로 맛길" };
}

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  // params는 요청 시점 데이터 — Suspense 안에서 읽어야 즉시 내비게이션이 가능
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      {params.then(({ id }) => (
        <Detail id={id} />
      ))}
    </Suspense>
  );
}

async function Detail({ id }: { id: string }) {
  const user = await getCurrentUser();
  const product = await getProduct(id, user?.id);
  if (!product) notFound();
  // 새로고침(router.refresh)으로 참여 인원·결제 상태가 바뀌면 화면 상태를 새로 시작
  return <ProductDetailScreen key={`${product.seats}-${product.status}-${product.myOrder?.id}`} product={product} />;
}
