import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { PlaceResultItem } from '@/components/place/PlaceResultItem';

const meta = {
  title: 'Components/Place/PlaceResultItem',
  component: PlaceResultItem,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="w-[360px]"><Story /></div>],
  args: {
    place: {
      name: '할머니 손칼국수',
      category: '한식 · 칼국수',
      address: '서울 구로구 고척로16길 29',
      lat: 37.5007,
      lng: 126.8625,
    },
    onSelect: fn(),
    className: 'px-(--spacing-16)',
  },
} satisfies Meta<typeof PlaceResultItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /할머니 손칼국수/ }));
    await expect(args.onSelect).toHaveBeenCalledWith(args.place);
  },
};

/** 긴 장소명·분류는 한 줄로 말줄임 */
export const LongName: Story = {
  args: {
    place: {
      name: '개봉동 손칼국수 공룡집 본점 2층 단체석',
      category: '한식 · 칼국수,만두,보쌈',
      address: '서울 구로구 개봉로 3길 18',
      lat: 37.4946,
      lng: 126.8555,
    },
  },
};
