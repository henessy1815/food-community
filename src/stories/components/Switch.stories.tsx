import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { Switch } from '@/components/ui/Switch';
import { Matrix } from './Matrix';

const meta = {
  title: 'Components/Form/Switch',
  component: Switch,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  args: { label: '알림 받기', size: 'sm', onCheckedChange: fn() },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <div className="flex flex-col gap-[40px]">
      {(['sm', 'md'] as const).map((size) => (
        <Matrix
          key={size}
          title={`${size} · ${size === 'sm' ? '16 × 32' : '20 × 40'}`}
          rows={['off', 'on'] as const}
          cols={['default', 'disabled'] as const}
          render={(sel, state) => (
            <Switch size={size} label="알림 받기" checked={sel === 'on'} disabled={state === 'disabled'} />
          )}
        />
      ))}
    </div>
  ),
};

export const Playground: Story = {
  play: async ({ canvas, args, userEvent }) => {
    const toggle = canvas.getByRole('switch', { name: '알림 받기' });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
    // 레이블을 눌러도 토글
    await userEvent.click(canvas.getByText('알림 받기'));
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  },
};

export const On: Story = { args: { defaultChecked: true } };
export const Medium: Story = { args: { size: 'md', defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };
