import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { PageBadge } from '@/components/ui/PageBadge';

const meta = {
  title: 'Components/Display/PageBadge',
  component: PageBadge,
  tags: ['ai-generated'],
  parameters: { layout: 'centered' },
  // 사진 위에 올리는 배지라 이미지 배경에서 확인
  decorators: [
    (Story) => (
      <div className="relative flex h-[160px] w-[280px] items-end justify-end overflow-hidden rounded-[14px] bg-[url(/images/gukbap-tour.jpg)] bg-cover bg-center p-[12px]">
        <Story />
      </div>
    ),
  ],
  args: { current: 1, total: 3 },
} satisfies Meta<typeof PageBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // 스크린리더에는 "3장 중 1번째"로 읽힌다
    const label = canvas.getByText('3장 중 1번째');
    const badge = label.parentElement!;
    await expect(getComputedStyle(badge).height).toBe('28px');
    await expect(getComputedStyle(badge).paddingLeft).toBe('10px');
    await expect(badge).toHaveClass('rounded-full', 'bg-background-overlay/60');
  },
};

export const TwoDigits: Story = { args: { current: 12, total: 26 } };
