import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { MyPageScreen } from '@/components/screens/MyPageScreen';
import type { Restaurant } from '@/lib/restaurants';
import { attendedOrder, lockedOrder, paidOrder, refundedOrder, refundingOrder } from '../components/productFixtures';

const post = (id: string, name: string, src: string, summary: string, region: string, date: string): Restaurant => ({
  id,
  name,
  summary,
  body: summary,
  photos: [{ src, alt: name }],
  author: { nickname: '구로댁', avatar: '/images/avatar.jpg' },
  createdAt: '2026-10-16T14:14:00+09:00',
  postedAgo: '2주 전',
  postedAt: '2026.10.16 · 오후 2:14',
  postedDate: date,
  mine: true,
  region,
});

const meta = {
  title: 'Screens/MyPage',
  component: MyPageScreen,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  args: {
    user: { nickname: '구로댁', email: 'guro.mom@gmail.com', avatar: '/images/avatar.jpg' },
    myPosts: [
      post('1', '오류동 할머니 손칼국수', '/images/kalguksu.jpg', '바지락이 듬뿍, 국물이 진해요. 가게 앞 주차 3대 가능해서 편해요.', '구로구 오류동', '2026.10.16'),
      post('2', '부천 시장 안 수제 만두', '/images/mandu.jpg', '직접 빚는 고기만두. 오전 11시 전에 가야 웨이팅이 짧아요.', '부천시 심곡동', '2026.10.02'),
    ],
    payments: [paidOrder, lockedOrder, attendedOrder],
    cancellations: [refundingOrder, refundedOrder],
  },
} satisfies Meta<typeof MyPageScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 07 마이 페이지 · 내가 쓴 글 */
export const Posts: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('tab', { name: '내가 쓴 글' })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByText('총 2건')).toBeVisible();
    // 프로필 설정 — 프로필 수정 버튼 활성
    await expect(canvas.getByRole('button', { name: '프로필 수정' })).toBeEnabled();
  },
};

/** 24 마이 페이지 · 결제 내역 → 25 결제 취소 확인 */
export const Payments: Story = {
  args: { initialTab: 'payments' },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(canvas.getByText('총 3건')).toBeVisible();
    await userEvent.click(canvas.getAllByRole('button', { name: '결제 취소' })[0]);
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: '결제를 취소할까요?' });
    await expect(within(dialog).getByText('환불 금액')).toBeVisible();
    // 헤더 X와 하단 '닫기' 버튼 중 하단 버튼
    await userEvent.click(within(dialog).getAllByRole('button', { name: '닫기' }).at(-1)!);
  },
};

/** 26 마이 페이지 · 취소 내역 */
export const Cancellations: Story = {
  args: { initialTab: 'cancels' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('환불 처리 중')).toBeVisible();
    await expect(canvas.getByText('환불 완료')).toBeVisible();
  },
};

/** 27 마이 페이지 · 결제 내역 없음 */
export const PaymentsEmpty: Story = {
  args: { initialTab: 'payments', payments: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('아직 결제한 상품이 없어요')).toBeVisible();
    await expect(canvas.getByRole('button', { name: '모임 둘러보기' })).toBeVisible();
  },
};
