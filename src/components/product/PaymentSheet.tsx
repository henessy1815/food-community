"use client";

import { useState } from "react";
import { Icon } from "@/components/foundations/Icon";
import { Badge } from "@/components/ui/Badge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  REFUND_DAYS,
  formatPrice,
  formatShortDate,
  remainingSeats,
  seatsLabel,
  shortWhen,
  type Product,
} from "@/lib/products";

export interface PaymentSheetProps {
  open: boolean;
  onClose: () => void;
  /** 시트를 열 때 다시 불러온 최신 상품 */
  product: Product;
  /** 동의 후 결제 버튼 — PG 결제창으로 이동 */
  onPay: () => void;
  /** 결제 요청 중 (중복 클릭 방지) */
  paying?: boolean;
  /** 약관 '보기' */
  onViewTerms?: () => void;
}

/** 결제 바텀시트 — 참여 인원 · 금액 확인, 환불 규정 동의 후 결제 */
export function PaymentSheet({ open, onClose, product: p, onPay, paying = false, onViewTerms }: PaymentSheetProps) {
  const [agreed, setAgreed] = useState(false);
  const closed = p.status !== "on_sale";
  const remaining = remainingSeats(p);

  const close = () => {
    setAgreed(false);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={close} label={`${p.title} 결제`}>
      <div className="flex flex-col gap-(--spacing-20)">
        <div className="flex flex-col gap-[4px]">
          {p.category && <p className="label-md text-text-brand-strong">{p.category}</p>}
          <h2 className="heading-md text-text-default">{p.title}</h2>
          <p className="label-md text-text-secondary">
            {shortWhen(p)} · {p.address}
          </p>
        </div>

        <dl className="flex flex-col gap-(--spacing-12) rounded-[14px] bg-background-subtle p-(--spacing-16)">
          <div className="flex items-center justify-between">
            <dt className="body-md text-text-secondary">참여 인원</dt>
            <dd className="flex items-center gap-[6px]">
              {closed ? <Badge type="error">마감</Badge> : <Badge type="warning">{remaining}자리 남음</Badge>}
              <span className="label-lg text-text-default">{seatsLabel(p)}</span>
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="body-md text-text-secondary">결제 수량</dt>
            <dd className="label-lg text-text-default">1인 1자리</dd>
          </div>
          <div aria-hidden className="h-px bg-border-default" />
          <div className="flex items-center justify-between">
            <dt className="body-md text-text-secondary">결제 금액</dt>
            <dd className="heading-md text-text-default">{formatPrice(p.price)}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-[6px]">
          <div className="flex items-center justify-between gap-(--spacing-8)">
            <Checkbox
              size="md"
              label="환불 규정·결제 약관에 동의해요 (필수)"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <button
              type="button"
              onClick={onViewTerms}
              className="shrink-0 cursor-pointer label-md text-text-secondary focus-visible:outline-2 focus-visible:outline-border-brand"
            >
              보기
            </button>
          </div>
          <p className="pl-[28px] label-md text-text-tertiary">
            행사 {REFUND_DAYS}일 전({formatShortDate(p.refundDeadline)})까지 전액 환불, 이후에는 취소할 수 없어요.
          </p>
        </div>

        <div className="flex flex-col items-center gap-(--spacing-12)">
          <Button size="lg" fullWidth disabled={closed || !agreed} loading={paying} onClick={onPay}>
            {closed ? "모집 마감" : `${formatPrice(p.price)} 결제하기`}
          </Button>
          <p className="flex items-center gap-[4px] label-md text-text-tertiary">
            <Icon name="lock" size={16} />
            카드·간편결제 결제창으로 이동해요
          </p>
        </div>
      </div>
    </BottomSheet>
  );
}
