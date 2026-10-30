import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { TabNavigation } from '@/components/ui/TabNavigation';

const meta = {
  title: 'Components/Navigation/TabNavigation',
  component: TabNavigation,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="max-w-[360px]"><Story /></div>],
  args: {
    label: '카테고리',
    items: [
      { value: 'all', label: '전체' },
      { value: 'korean', label: '한식' },
      { value: 'chinese', label: '중식' },
      { value: 'cafe', label: '카페' },
    ],
    onValueChange: fn(),
  },
} satisfies Meta<typeof TabNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(getComputedStyle(canvas.getByRole('tablist')).height).toBe('48px');
    await userEvent.click(canvas.getByRole('tab', { name: '한식' }));
    await expect(canvas.getByRole('tab', { name: '한식' })).toHaveAttribute('aria-selected', 'true');
    await expect(args.onValueChange).toHaveBeenCalledWith('korean');
    // 좌우 화살표로 이동
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('tab', { name: '중식' })).toHaveAttribute('aria-selected', 'true');
  },
};

export const TwoTabs: Story = {
  args: { items: [{ value: 'posts', label: '작성한 글' }, { value: 'saved', label: '저장한 맛집' }] },
};
