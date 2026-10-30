import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Badge } from '@/components/ui/Badge';
import { Matrix } from './Matrix';

const labels = { neutral: '주차 가능', success: '영업 중', error: '휴무', info: 'NEW', warning: '대기 30분' } as const;
const types = ['neutral', 'success', 'error', 'info', 'warning'] as const;

const meta = {
  title: 'Components/Display/Badge',
  component: Badge,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: {
    type: { control: 'inline-radio', options: types },
    size: { control: 'inline-radio', options: ['md', 'lg'] },
  },
  args: { type: 'neutral', size: 'md', children: labels.neutral },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <Matrix
      rows={types}
      cols={['md · 20', 'lg · 24'] as const}
      render={(type, col) => (
        <Badge type={type} size={col.startsWith('md') ? 'md' : 'lg'}>
          {labels[type]}
        </Badge>
      )}
    />
  ),
};

export const Playground: Story = {
  play: async ({ canvas }) => {
    const badge = canvas.getByText(labels.neutral);
    await expect(getComputedStyle(badge).height).toBe('20px');
    await expect(getComputedStyle(badge).paddingLeft).toBe('8px');
  },
};

export const Success: Story = { args: { type: 'success', children: labels.success } };
export const Large: Story = { args: { size: 'lg' } };
