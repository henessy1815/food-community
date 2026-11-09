import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { CancelHistoryItem, PaymentHistoryItem } from '@/components/product/OrderHistoryItem';
import { attendedOrder, lockedOrder, paidOrder, refundedOrder, refundingOrder } from './productFixtures';

const meta = {
  title: 'Components/Product/OrderHistoryItem',
  component: PaymentHistoryItem,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="w-[328px]"><Story /></div>],
  args: { order: paidOrder, onCancel: fn() },
} satisfies Meta<typeof PaymentHistoryItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 결제 완료 · 환불 기간 안 */
export const Paid: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByText('결제 완료')).toBeVisible();
    await expect(canvas.getByText('2026.11.02 결제')).toBeVisible();
    await expect(canvas.getByRole('link', { name: /광명 숨은 국밥 투어/ })).toHaveAttribute(
      'href',
      '/products/gwangmyeong-gukbap-tour',
    );
    await expect(canvas.getByText('11/18(수)까지 전액 환불 가능')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '결제 취소' }));
    await expect(args.onCancel).toHaveBeenCalledWith(paidOrder);
  },
};

/** 환불 기간이 지나 취소 불가 */
export const CancelLocked: Story = {
  args: { order: lockedOrder },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('행사 3일 전까지만 취소할 수 있어요')).toBeVisible();
    await expect(canvas.getByRole('button', { name: '결제 취소' })).toBeDisabled();
  },
};

/** 행사가 끝난 주문 — 취소 영역 없음 */
export const Attended: Story = {
  args: { order: attendedOrder },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('참여 완료')).toBeVisible();
    await expect(canvas.queryByRole('button', { name: '결제 취소' })).toBeNull();
  },
};

export const CancelRefunding: Story = {
  render: () => <CancelHistoryItem order={refundingOrder} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('환불 처리 중')).toBeVisible();
    await expect(canvas.getByText('2026.11.01 취소')).toBeVisible();
    await expect(canvas.getByText('결제한 카드로 3~5영업일 안에 들어와요')).toBeVisible();
  },
};

export const CancelRefunded: Story = {
  render: () => <CancelHistoryItem order={refundedOrder} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('환불 완료')).toBeVisible();
    await expect(canvas.getByText('10.15 환불이 완료됐어요')).toBeVisible();
  },
};
