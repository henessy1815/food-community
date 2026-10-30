import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CardProps {
  /** 이미지 영역 — 생략하면 제외 */
  image?: { src: string; alt: string };
  title?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  /** 콘텐츠 영역을 직접 구성할 때 */
  children?: ReactNode;
  className?: string;
}

export function Card({ image, title, description, meta, children, className }: CardProps) {
  return (
    <article
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-[14px] border border-border-default bg-background-default",
        className,
      )}
    >
      {image && (
        <div className="relative h-[160px] w-full shrink-0 bg-background-muted">
          <Image src={image.src} alt={image.alt} fill sizes="(max-width: 767px) 100vw, 320px" className="object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-[6px] p-[16px]">
        {children ?? (
          <>
            {title && <h3 className="heading-sm text-text-default">{title}</h3>}
            {description && <p className="body-md text-text-secondary">{description}</p>}
            {meta && <p className="label-md text-text-tertiary">{meta}</p>}
          </>
        )}
      </div>
    </article>
  );
}
