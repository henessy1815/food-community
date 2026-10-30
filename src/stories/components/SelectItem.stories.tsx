import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { SelectItem } from '@/components/ui/SelectItem';
import { Matrix } from './Matrix';

const meta = {
  title: 'Components/Form/SelectItem',
  component: SelectItem,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <ul role="listbox" aria-label="카테고리" className="w-[240px]"><Story /></ul>],
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  args: { children: '한식', size: 'md' },
} satisfies Meta<typeof SelectItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <Matrix
      rows={['sm', 'md', 'lg'] as const}
      cols={['default', 'selected', 'disabled'] as const}
      rowLabel={(s) => `${s} · ${{ sm: 32, md: 40, lg: 48 }[s]}`}
      render={(size, state) => (
        <ul role="listbox" aria-label={`${size} ${state}`} className="w-[240px]">
          <SelectItem size={size} selected={state === 'selected'} disabled={state === 'disabled'}>
            한식
          </SelectItem>
        </ul>
      )}
    />
  ),
};

export const Playground: Story = {};

export const Selected: Story = {
  args: { selected: true },
  play: async ({ canvas }) => {
    // 선택 시 우측 체크 아이콘 + color-text-brand
    const option = canvas.getByRole('option', { name: '한식' });
    await expect(option).toHaveAttribute('aria-selected', 'true');
    await expect(option.querySelector('svg')).not.toBeNull();
    await expect(getComputedStyle(option).color).toBe('rgb(255, 90, 54)');
  },
};

export const Disabled: Story = { args: { disabled: true } };
