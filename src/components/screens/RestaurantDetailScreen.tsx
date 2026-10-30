"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/foundations/Icon";
import { BottomBar, SectionDivider } from "@/components/layout/BottomBar";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceSummary } from "@/components/place/PlaceSummary";
import { MapPreview } from "@/components/restaurant/MapPreview";
import { PhotoCarousel } from "@/components/restaurant/PhotoCarousel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { deletePlace } from "@/lib/place";
import { fullAddress, naverMapUrl, type Restaurant } from "@/lib/restaurants";

export function RestaurantDetailScreen({ restaurant: r }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const address = fullAddress(r);
  const mapUrl = naverMapUrl(r);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setToast({ type: "success", message: "주소를 복사했어요" });
    } catch {
      setToast({ type: "error", message: "주소를 복사하지 못했어요" });
    }
  };

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    const error = await deletePlace(r.id);
    setDeleting(false);
    setDeleteOpen(false);
    if (error) return setToast({ type: "error", message: error });
    router.replace("/");
    router.refresh();
  };

  const directions = (
    <Button size="lg" fullWidth iconLeft="navigation" onClick={() => window.open(mapUrl, "_blank", "noreferrer")}>
      네이버 지도로 길찾기
    </Button>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        back
        trailing={
          r.mine && (
            <>
              <Button
                variant="secondary"
                size="sm"
                iconLeft="edit"
                onClick={() => router.push(`/restaurants/${r.id}/edit`)}
              >
                수정
              </Button>
              <Button variant="destructive" size="sm" iconLeft="delete" onClick={() => setDeleteOpen(true)}>
                삭제
              </Button>
            </>
          )
        }
      />

      {/* 모바일·태블릿: 단일 컬럼(최대 720) · 데스크톱: 본문 | 위치 2단(최대 1280) — 주소가 없으면 단일 컬럼 유지 */}
      <main
        className={cn(
          "mx-auto w-full max-w-[720px] flex-1 lg:px-(--spacing-32) lg:pt-(--spacing-8) lg:pb-(--spacing-32)",
          r.address &&
            "lg:grid lg:max-w-[1280px] lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-(--spacing-32)",
        )}
      >
        <article className="min-w-0">
          <PhotoCarousel photos={r.photos} />

          <div className="flex flex-col gap-(--spacing-16) px-(--spacing-16) pt-(--spacing-16) pb-(--spacing-24) md:px-(--spacing-24) lg:px-0">
            <div className="flex flex-col items-start gap-(--spacing-8)">
              {r.region && <Badge>{r.region}</Badge>}
              <h1 className="heading-lg text-text-default">{r.name}</h1>
            </div>

            <div className="flex items-center gap-(--spacing-12)">
              <Image
                src={r.author.avatar}
                alt=""
                width={36}
                height={36}
                className="size-[36px] shrink-0 rounded-full object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-px">
                <p className="flex items-center gap-(--spacing-8)">
                  <span className="label-lg text-text-default">{r.author.nickname}</span>
                  {r.mine && <Badge>내 글</Badge>}
                </p>
                <p className="label-md text-text-tertiary">{r.postedAt}</p>
              </div>
            </div>

            <hr className="border-border-default" />

            <p className="body-lg whitespace-pre-line text-text-body">{r.body}</p>
          </div>

          {/* 장소명만 직접 입력한 글 — 주소·지도 없이 장소명만 보여준다 */}
          {!r.address && r.placeName && (
            <>
              <SectionDivider className="lg:hidden" />
              <section
                aria-labelledby="location-title"
                className="flex flex-col gap-(--spacing-12) px-(--spacing-16) py-(--spacing-24) md:px-(--spacing-24) lg:px-0 lg:pt-0"
              >
                <h2 id="location-title" className="heading-sm text-text-default">
                  위치
                </h2>
                <PlaceSummary title={r.placeName} description="주소·지도 위치 없이 장소명만 등록됐어요" />
              </section>
            </>
          )}
        </article>

        {r.address && (
          <aside className="lg:sticky lg:top-[72px]">
            <SectionDivider className="lg:hidden" />
            <section
              aria-labelledby="location-title"
              className="flex flex-col gap-(--spacing-12) px-(--spacing-16) py-(--spacing-24) md:px-(--spacing-24) lg:px-0 lg:pt-0"
            >
              <h2 id="location-title" className="heading-sm text-text-default">
                위치
              </h2>
              <div
                onClick={copyAddress}
                className="flex cursor-pointer items-center gap-(--spacing-12) rounded-[14px] border border-border-default bg-background-default p-(--spacing-12)"
              >
                <Icon name="map-pin" size={20} className="text-text-brand" />
                <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <p className="label-lg text-text-default">{address}</p>
                  <p className="label-md text-text-tertiary">누르면 주소가 복사돼요</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft="copy"
                  aria-label="주소 복사"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyAddress();
                  }}
                >
                  복사
                </Button>
              </div>
              <MapPreview label={r.placeName ?? r.name} href={mapUrl} lat={r.lat} lng={r.lng} />
              <p className="flex items-center gap-[4px] text-text-tertiary">
                <Icon name="external-link" size={16} />
                <span className="label-md">지도를 누르면 길찾기 앱으로 연결돼요</span>
              </p>
              <div className="hidden pt-(--spacing-12) lg:block">{directions}</div>
            </section>
          </aside>
        )}
      </main>

      {r.address && (
        <BottomBar size="wide" className="lg:hidden">
          <div className="w-full max-w-[672px]">{directions}</div>
        </BottomBar>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[96px] z-40 flex justify-center px-(--spacing-16) lg:bottom-(--spacing-32)">
          <Toast type={toast.type}>{toast.message}</Toast>
        </div>
      )}

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="맛집을 삭제할까요?"
        secondaryAction={{ label: "취소", onClick: () => setDeleteOpen(false) }}
        primaryAction={{ label: "삭제", destructive: true, loading: deleting, onClick: remove }}
      >
        삭제한 글과 사진은 다시 복구할 수 없어요. 삭제하면 목록으로 이동해요.
      </Modal>
    </div>
  );
}
