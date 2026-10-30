import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { PlaceSummary } from '@/components/place/PlaceSummary';

const meta = {
  title: 'Components/Place/PlaceSummary',
  component: PlaceSummary,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="w-[328px]"><Story /></div>],
  args: {
    title: '서울 구로구 고척로16길 29',
    description: '핀이 가게 위치와 맞는지 확인해주세요',
  },
} satisfies Meta<typeof PlaceSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('서울 구로구 고척로16길 29')).toBeVisible();
  },
};

/** 직접 입력한 장소 — 주소 없이 장소명만 */
export const NameOnly: Story = {
  args: {
    title: '구로 할머니국수집',
    description: '주소·지도 위치 없이 장소명만 등록돼요',
  },
};
