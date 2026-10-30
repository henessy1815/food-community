import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { IconButton } from '@/components/ui/IconButton';
import { iconNames } from '@/components/foundations/Icon';
import { Matrix } from './Matrix';

const meta = {
  title: 'Components/Action/IconButton',
  component: IconButton,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['ghost', 'circle-brand', 'circle-neutral'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    icon: { control: 'select', options: iconNames },
  },
  args: { icon: 'heart', label: '좋아요', variant: 'ghost', onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <Matrix
      rows={['ghost', 'circle-brand', 'circle-neutral'] as const}
      cols={['48 × 48 · icon 24'] as const}
      render={(variant) => <IconButton icon="heart" label="좋아요" variant={variant} />}
    />
  ),
};

export const Playground: Story = {
  play: async ({ canvas, args, userEvent }) => {
    const button = canvas.getByRole('button', { name: '좋아요' });
    await expect(getComputedStyle(button).width).toBe('48px');
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const CircleBrand: Story = {
  args: { variant: 'circle-brand' },
  play: async ({ canvas }) => {
    // 배경 color-background-brand(#FF5A36)
    await expect(getComputedStyle(canvas.getByRole('button')).backgroundColor).toBe('rgb(255, 90, 54)');
  },
};

export const CircleNeutral: Story = { args: { variant: 'circle-neutral' } };

/** 파일 아이템 삭제 등 작은 영역용 24 × 24 */
export const CircleNeutralSmall: Story = {
  args: { variant: 'circle-neutral', size: 'sm', icon: 'close', label: '삭제' },
};
