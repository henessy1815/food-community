import Image from "next/image";
import { Icon } from "@/components/foundations/Icon";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { NaverMapLayer } from "./NaverMapLayer";

/**
 * 지도 미리보기 + 가게 핀
 * - 좌표가 있으면 보기 전용 네이버 지도(JS SDK) 위 가운데에 네이버 마커를 겹친다
 * - 좌표가 없으면 정적 이미지
 */
export function MapPreview({
  label,
  href,
  lat,
  lng,
  fill = false,
  className,
}: {
  label: string;
  /** 지정하면 길찾기 앱으로 연결 */
  href?: string;
  lat?: number;
  lng?: number;
  /** 고정 높이 대신 남은 세로 공간을 채움 (장소 등록 화면) */
  fill?: boolean;
  className?: string;
}) {
  const hasCoords = lat !== undefined && lng !== undefined;
  const body = (
    <>
      {hasCoords ? (
        <NaverMapLayer lat={lat} lng={lng} />
      ) : (
        <Image src="/images/map-guro.jpg" alt="" fill sizes="(max-width: 1023px) 100vw, 400px" className="object-cover" />
      )}
      {/* 마커 끝이 지도 중심(좌표)에 오도록 말풍선 전체를 위로 올린다 */}
      <span className={cn("relative flex flex-col items-center", hasCoords && "-translate-y-1/2")}>
        <Badge>{label}</Badge>
        {hasCoords ? (
          <Image src="/images/naver-map-pin.png" alt="" width={55} height={36} className="h-[36px] w-[55px] object-contain" />
        ) : (
          <Icon name="map-pin" size={32} className="text-text-brand" />
        )}
      </span>
    </>
  );
  const box = cn(
    "relative flex w-full items-center justify-center overflow-hidden rounded-[16px] border border-border-default bg-background-muted",
    fill ? "min-h-[240px] flex-1" : "h-[180px] md:h-[240px] lg:h-[200px]",
    className,
  );

  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${label} 지도에서 보기`}
      className={cn(box, "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-brand")}
    >
      {body}
    </a>
  ) : (
    <div role="img" aria-label={`${label} 위치 지도`} className={box}>
      {body}
    </div>
  );
}
