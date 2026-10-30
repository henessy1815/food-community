import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const meta = {
  title: 'Components/Display/Card',
  component: Card,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="w-[320px]"><Story /></div>],
  args: {
    image: { src: '/images/sample-food.png', alt: '바지락 칼국수' },
    title: '오류동 할머니 손칼국수',
    description: '바지락이 듬뿍, 국물이 진해요. 가게 앞 주차 3대 가능해서 편해요.',
    meta: '구로댁 · 2시간 전',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: '바지락 칼국수' })).toBeVisible();
    await expect(canvas.getByRole('heading', { name: '오류동 할머니 손칼국수' })).toBeVisible();
  },
};

/** 이미지 영역 제외 */
export const WithoutImage: Story = {
  args: { image: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('img')).toBeNull();
  },
};

/** 콘텐츠 영역 직접 구성 */
export const CustomContent: Story = {
  args: {
    children: (
      <>
        <div className="flex gap-[6px]">
          <Badge type="success">영업 중</Badge>
          <Badge>주차 가능</Badge>
        </div>
        <h3 className="heading-sm">오류동 할머니 손칼국수</h3>
        <p className="body-md text-text-secondary">서울 구로구 오류로 12</p>
      </>
    ),
  },
};
