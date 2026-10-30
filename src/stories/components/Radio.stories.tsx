import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { Radio, RadioGroup } from '@/components/ui/Radio';
import { Matrix } from './Matrix';

const meta = {
  title: 'Components/Form/Radio',
  component: RadioGroup,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    direction: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
  },
  args: { legend: '카테고리', size: 'sm', defaultValue: 'korean', onValueChange: fn(), children: null },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="korean" label="한식" />
      <Radio value="chinese" label="중식" />
      <Radio value="japanese" label="일식" />
      <Radio value="cafe" label="카페" disabled />
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <div className="flex flex-col gap-[40px]">
      {(['sm', 'md'] as const).map((size) => (
        <Matrix
          key={size}
          title={`${size} · ${size === 'sm' ? 16 : 20}`}
          rows={['unselected', 'selected'] as const}
          cols={['default', 'disabled'] as const}
          render={(selection, state) => (
            <RadioGroup size={size} value={selection === 'selected' ? 'a' : undefined} disabled={state === 'disabled'}>
              <Radio value="a" label="한식" />
            </RadioGroup>
          )}
        />
      ))}
    </div>
  ),
};

export const Playground: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByText('중식'));
    await expect(canvas.getByRole('radio', { name: '중식' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: '한식' })).not.toBeChecked();
    await expect(args.onValueChange).toHaveBeenCalledWith('chinese');
    // 키보드 이동
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: '일식' })).toBeChecked();
  },
};

export const Horizontal: Story = { args: { direction: 'horizontal' } };
export const Medium: Story = { args: { size: 'md' } };
export const Disabled: Story = { args: { disabled: true } };
