import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Skeleton } from '@/components/ui/Skeleton';
import { Matrix } from './Matrix';

const meta = {
  title: 'Components/Feedback/Skeleton',
  component: Skeleton,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: { variant: { control: 'inline-radio', options: ['text', 'rect', 'circle'] } },
  args: { variant: 'text', width: 240 },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <Matrix
      rows={['text', 'rect', 'circle'] as const}
      cols={['default'] as const}
      render={(variant) => <Skeleton variant={variant} width={variant === 'text' ? 240 : undefined} />}
    />
  ),
};

export const Playground: Story = {};

/** 대상 요소(카드) 형태에 맞춘 조합 */
export const CardPlaceholder: Story = {
  render: () => (
    <div data-testid="placeholder" className="flex w-[320px] items-center gap-[12px]">
      <Skeleton variant="rect" width={72} height={72} />
      <div className="flex flex-1 flex-col gap-[8px]">
        <Skeleton variant="text" height={19} />
        <Skeleton variant="text" width="70%" height={20} />
        <div className="flex items-center gap-[6px]">
          <Skeleton variant="circle" height={20} />
          <Skeleton variant="text" width={80} height={17} />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const circle = canvas.getByTestId('placeholder').querySelector<HTMLElement>('[data-variant="circle"]')!;
    // 원형: 지름 기준 정원 · 뉴트럴 컬러(color-background-muted)
    await expect(circle.offsetWidth).toBe(circle.offsetHeight);
    await expect(getComputedStyle(circle).backgroundColor).toBe('rgb(236, 236, 234)');
  },
};
