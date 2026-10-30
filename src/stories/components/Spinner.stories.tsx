import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Spinner } from '@/components/ui/Spinner';

const meta = {
  title: 'Components/Feedback/Spinner',
  component: Spinner,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: { size: { control: false } },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    // md(24) · 브랜드 컬러
    const status = canvas.getByRole('status', { name: '로딩 중' });
    await expect(status.querySelector('svg')).toHaveAttribute('width', '24');
    await expect(getComputedStyle(status).color).toBe('rgb(255, 90, 54)');
  },
};
