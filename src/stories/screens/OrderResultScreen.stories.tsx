import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { OrderResultScreen } from '@/components/screens/OrderResultScreen';
import { paidOrder } from '../components/productFixtures';

const meta = {
  title: 'Screens/OrderResult',
  component: OrderResultScreen,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  args: { order: paidOrder },
} satisfies Meta<typeof OrderResultScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 22 결제 완료 */
export const Complete: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: '결제가 완료되었어요' })).toBeVisible();
    await expect(canvas.getByText('11월 21일 토요일, 철산역에서 만나요!')).toBeVisible();
    await expect(canvas.getByText('20261102-0001')).toBeVisible();
    await expect(canvas.getByText('11/18(수)까지 마이 페이지 › 결제 내역에서 취소하면 전액 환불돼요.')).toBeVisible();
    await expect(canvas.getByRole('button', { name: '결제 내역 보기' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: '메인으로' })).toBeVisible();
  },
};

/** 23 결제 실패 */
export const Failed: Story = {
  args: {
    order: { ...paidOrder, orderNo: '20261102-0002', status: 'failed', failReason: '카드사 승인 거절 (한도 초과)' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: '결제가 완료되지 않았어요' })).toBeVisible();
    await expect(canvas.getByText('0원 (청구되지 않음)')).toBeVisible();
    await expect(canvas.getByRole('button', { name: '다시 시도' })).toBeVisible();
  },
};
