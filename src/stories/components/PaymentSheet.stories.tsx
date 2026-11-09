import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, within } from 'storybook/test';
import { PaymentSheet } from '@/components/product/PaymentSheet';
import { gukbapTour, soldOut } from './productFixtures';

const meta = {
  title: 'Components/Product/PaymentSheet',
  component: PaymentSheet,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  args: { open: true, onClose: fn(), onPay: fn(), onViewTerms: fn(), product: gukbapTour },
} satisfies Meta<typeof PaymentSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 동의 전 → 동의하면 결제 버튼 활성 */
export const Default: Story = {
  play: async ({ canvasElement, args, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const sheet = await body.findByRole('dialog', { name: '광명 숨은 국밥 투어 결제' });
    const sheetQ = within(sheet);
    await expect(sheetQ.getByText('4자리 남음')).toBeVisible();
    await expect(sheetQ.getByText('8 / 12명')).toBeVisible();
    await expect(sheetQ.getByText('행사 3일 전(11/18)까지 전액 환불, 이후에는 취소할 수 없어요.')).toBeVisible();

    const pay = sheetQ.getByRole('button', { name: '25,000원 결제하기' });
    await expect(pay).toBeDisabled();
    await userEvent.click(sheetQ.getByRole('checkbox', { name: /환불 규정·결제 약관에 동의해요/ }));
    await expect(pay).toBeEnabled();
    await userEvent.click(pay);
    await expect(args.onPay).toHaveBeenCalledTimes(1);

    await userEvent.click(sheetQ.getByRole('button', { name: '보기' }));
    await expect(args.onViewTerms).toHaveBeenCalled();
  },
};

export const Paying: Story = {
  args: { paying: true },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const pay = await body.findByRole('button', { name: '25,000원 결제하기' });
    // 결제 요청 중에는 중복 클릭 방지
    await expect(pay).toHaveAttribute('aria-busy', 'true');
    await expect(pay).toBeDisabled();
  },
};

/** 방금 마감 — 결제 직전 서버 확인에서 자리가 없을 때 */
export const SoldOut: Story = {
  args: { product: soldOut },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await body.findByRole('dialog');
    await expect(body.getByText('마감')).toBeVisible();
    await expect(body.getByText('12 / 12명')).toBeVisible();
    await expect(body.getByRole('button', { name: '모집 마감' })).toBeDisabled();
  },
};
