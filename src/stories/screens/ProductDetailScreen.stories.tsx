import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { ProductDetailScreen } from '@/components/screens/ProductDetailScreen';
import { dbProduct, gukbapTour, soldOut } from '../components/productFixtures';

const meta = {
  title: 'Screens/ProductDetail',
  component: ProductDetailScreen,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  args: { product: gukbapTour },
} satisfies Meta<typeof ProductDetailScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 16 모임 상세 · 판매 중 */
export const OnSale: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.getByText('모집 중')).toBeVisible();
    await expect(canvas.getByText('4자리 남았어요 · 결제 순서대로 자리가 확정돼요')).toBeVisible();
    // 결제하기 → 결제 바텀시트
    await userEvent.click(canvas.getByRole('button', { name: '결제하기' }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('dialog', { name: '광명 숨은 국밥 투어 결제' })).toBeVisible();
  },
};

/** 17 모임 상세 · 모집 마감 */
export const Closed: Story = {
  args: { product: soldOut },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('모집 마감')[0]).toBeVisible();
    await expect(canvas.getByRole('button', { name: '모집 마감' })).toBeDisabled();
    await expect(canvas.getByText('정원이 모두 찼어요 · 취소 자리가 생기면 다시 열려요')).toBeVisible();
  },
};

/** 18 모임 상세 · 참여 예정 */
export const Joined: Story = {
  args: { product: { ...gukbapTour, seats: 9, myOrder: { id: 'order-1', paidAt: '2026-11-02T10:12:00+09:00' } } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('11/02 결제 완료')).toBeVisible();
    await expect(canvas.getByRole('link', { name: '결제 내역 보기' })).toHaveAttribute('href', '/mypage?tab=payments');
    await expect(canvas.getByRole('button', { name: '참여 예정' })).toBeDisabled();
  },
};

export const Ended: Story = {
  args: { product: { ...gukbapTour, status: 'ended' } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '판매 종료' })).toBeDisabled();
  },
};

/** DB 컬럼만 있는 상품 — 카테고리·요약·주차·진행 순서·포함 안내를 숨긴다 */
export const DbOnly: Story = {
  args: { product: dbProduct },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: '심심한 주말 놓치기 아까운 기회' })).toBeVisible();
    await expect(canvas.getByText('2026.11.21 (토) 오전 10:00')).toBeVisible();
    await expect(canvas.getByText('서울특별시 강동구 고덕로 강일동 요리센터 2층')).toBeVisible();
    await expect(canvas.queryByText('주차')).toBeNull();
    await expect(canvas.queryByText('진행 순서')).toBeNull();
    await expect(canvas.getByText('17자리 남았어요 · 결제 순서대로 자리가 확정돼요')).toBeVisible();
  },
};
