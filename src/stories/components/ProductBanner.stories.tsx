import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import { ProductBanner } from '@/components/product/ProductBanner';
import { gukbapTour, kalguksuTalk, manduClass } from './productFixtures';

const meta = {
  title: 'Components/Product/ProductBanner',
  component: ProductBanner,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="max-w-[360px]"><Story /></div>],
  args: { products: [gukbapTour, manduClass, kalguksuTalk], interval: 0 },
} satisfies Meta<typeof ProductBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const link = canvas.getByRole('link', { name: /광명 숨은 국밥 투어/ });
    await expect(link).toHaveAttribute('href', '/products/gwangmyeong-gukbap-tour');
    await expect(link).toHaveTextContent('11/21(토) 11:00');
    await expect(link).toHaveTextContent('8 / 12명');
    await expect(canvas.getByText('3장 중 1번째')).toBeInTheDocument();
    // 화면 폭에 꽉 차는 240px 배너
    await expect(getComputedStyle(link.parentElement!).height).toBe('240px');

    // 도트로 두 번째 배너 이동
    await userEvent.click(canvas.getByRole('button', { name: '2번째 배너 보기' }));
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '2번째 배너 보기' })).toHaveAttribute('aria-current', 'true'),
    );
  },
};

export const Single: Story = {
  args: { products: [gukbapTour] },
  play: async ({ canvas }) => {
    // 한 장이면 도트를 숨긴다
    await expect(canvas.queryByRole('button', { name: /배너 보기/ })).toBeNull();
  },
};

export const Empty: Story = {
  args: { products: [] },
  play: async ({ canvasElement }) => {
    // 보여줄 상품이 없으면 배너 영역을 숨긴다
    await expect(canvasElement.querySelector('section')).toBeNull();
  },
};

export const AutoPlay: Story = { args: { interval: 3000 } };
