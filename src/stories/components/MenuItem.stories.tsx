import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { MenuItem } from '@/components/ui/MenuItem';
import { iconNames } from '@/components/foundations/Icon';
import { Matrix } from './Matrix';

const meta = {
  title: 'Components/Overlay/MenuItem',
  component: MenuItem,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div role="menu" className="w-[240px]"><Story /></div>],
  argTypes: {
    type: { control: 'inline-radio', options: ['default', 'destructive'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    icon: { control: 'select', options: [undefined, ...iconNames] },
  },
  args: { children: '수정하기', icon: 'edit', size: 'md' },
} satisfies Meta<typeof MenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex flex-col gap-[40px]">
      {(['default', 'destructive'] as const).map((type) => (
        <Matrix
          key={type}
          title={type}
          rows={['sm', 'md', 'lg'] as const}
          cols={['default', 'disabled'] as const}
          rowLabel={(s) => `${s} · ${{ sm: 32, md: 40, lg: 48 }[s]}`}
          render={(size, state) => (
            <div role="menu" className="w-[240px]">
              <MenuItem
                type={type}
                size={size}
                icon={type === 'destructive' ? 'delete' : 'edit'}
                disabled={state === 'disabled'}
              >
                {type === 'destructive' ? '삭제하기' : '수정하기'}
              </MenuItem>
            </div>
          )}
        />
      ))}
    </div>
  ),
};

export const Playground: Story = {};

export const Destructive: Story = {
  args: { type: 'destructive', icon: 'delete', children: '삭제하기' },
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByRole('menuitem')).color).toBe('rgb(229, 57, 53)');
  },
};

export const WithoutIcon: Story = { args: { icon: undefined } };
export const Disabled: Story = { args: { disabled: true } };
