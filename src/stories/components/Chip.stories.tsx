import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Chip } from '@/components/ui/Chip';
import { iconNames } from '@/components/foundations/Icon';
import { Matrix } from './Matrix';

const meta = {
  title: 'Components/Form/Chip',
  component: Chip,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    icon: { control: 'select', options: [undefined, ...iconNames] },
  },
  args: { children: '한식', size: 'md' },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <div className="flex flex-col gap-[40px]">
      {(['sm', 'md'] as const).map((size) => (
        <Matrix
          key={size}
          title={`${size} · ${size === 'sm' ? 24 : 32}`}
          rows={['unselected', 'selected', 'unselected + icon', 'selected + icon'] as const}
          cols={['default', 'disabled'] as const}
          render={(row, state) => (
            <Chip
              size={size}
              selected={row.startsWith('selected')}
              icon={row.endsWith('icon') ? 'utensils' : undefined}
              disabled={state === 'disabled'}
            >
              한식
            </Chip>
          )}
        />
      ))}
    </div>
  ),
};

export const Playground: Story = {};

export const WithIcon: Story = {
  args: { icon: 'utensils' },
  play: async ({ canvas }) => {
    // 좌측 아이콘이 있으면 md 좌우 패딩 8px
    await expect(getComputedStyle(canvas.getByRole('button')).paddingLeft).toBe('8px');
  },
};

export const FilterGroup: Story = {
  render: function Render() {
    const items = ['전체', '한식', '중식', '일식', '카페'];
    const [value, setValue] = useState('전체');
    return (
      <div className="flex gap-[8px]" role="group" aria-label="카테고리 필터">
        {items.map((i) => (
          <Chip key={i} selected={value === i} onClick={() => setValue(i)}>
            {i}
          </Chip>
        ))}
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '중식' }));
    await expect(canvas.getByRole('button', { name: '중식' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'false');
  },
};

export const Disabled: Story = { args: { disabled: true } };
