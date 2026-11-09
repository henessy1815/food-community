import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { PaymentConfirm } from '@/components/product/PaymentConfirm';
import type { OrderErrorBody } from '@/lib/products';
import { gukbapTour } from './productFixtures';

/** POST /api/payments/complete 응답 흉내 — body가 없으면 응답하지 않는다(확인 중 상태 유지) */
function mockComplete(status?: number, body?: OrderErrorBody) {
  const original = window.fetch;
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), window.location.origin);
    if (url.pathname !== '/api/payments/complete') return original(input, init);
    if (!status) return new Promise<Response>(() => {});
    return Response.json(body, { status });
  }) as typeof fetch;
  return () => {
    window.fetch = original;
  };
}

const meta = {
  title: 'Components/Product/PaymentConfirm',
  component: PaymentConfirm,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  args: { paymentId: '1a2b3c4d-0000-4000-8000-000000000000', product: gukbapTour },
} satisfies Meta<typeof PaymentConfirm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 결제창에서 돌아와 서버가 검증하는 중 */
export const Confirming: Story = {
  beforeEach: () => mockComplete(),
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('결제를 확인하고 있어요')).toBeVisible();
  },
};

/** 검증 실패 → 자동 환불 — 결제 실패 화면 */
export const Refunded: Story = {
  beforeEach: () =>
    mockComplete(409, { code: 'SOLD_OUT', message: '방금 마감되었어요. 결제는 자동으로 취소돼요.' }),
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('heading', { name: '결제가 완료되지 않았어요' })).toBeVisible();
    await expect(canvas.getByText('방금 마감되었어요. 결제는 자동으로 취소돼요.')).toBeVisible();
    await expect(canvas.getByRole('button', { name: '다시 시도' })).toBeVisible();
  },
};

/** 결제는 됐을 수 있는데 확인 실패(서버 오류) — 실패로 단정하지 않고 다시 확인 */
export const Unconfirmed: Story = {
  beforeEach: () => mockComplete(503, { message: '결제 확인이 늦어지고 있어요. 잠시 후 다시 시도해주세요.' }),
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('결제를 확인하지 못했어요')).toBeVisible();
    await expect(canvas.getByRole('button', { name: '다시 확인' })).toBeVisible();
    await expect(canvas.queryByText('0원 (청구되지 않음)')).toBeNull();
  },
};
