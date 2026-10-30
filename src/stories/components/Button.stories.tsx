import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { Button } from '@/components/ui/Button';
import { iconNames } from '@/components/foundations/Icon';
import { Matrix } from './Matrix';

const meta = {
  title: 'Components/Action/Button',
  component: Button,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'destructive'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    iconLeft: { control: 'select', options: [undefined, ...iconNames] },
    iconRight: { control: 'select', options: [undefined, ...iconNames] },
  },
  args: { children: '등록하기', variant: 'primary', size: 'md', iconLeft: 'plus', onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const variants = ['primary', 'secondary', 'destructive'] as const;
const states = ['default', 'disabled', 'loading'] as const;
const sizes = ['sm', 'md', 'lg'] as const;
const sample = { primary: ['등록하기', 'plus'], secondary: ['수정하기', 'edit'], destructive: ['삭제하기', 'delete'] } as const;

export const Overview: Story = {
  render: () => (
    <div className="flex flex-col gap-[40px]">
      {variants.map((variant) => (
        <Matrix
          key={variant}
          title={variant}
          rows={sizes}
          cols={states}
          rowLabel={(s) => `${s} · ${{ sm: 32, md: 40, lg: 48 }[s]}`}
          render={(size, state) => (
            <Button
              variant={variant}
              size={size}
              iconLeft={sample[variant][1]}
              disabled={state === 'disabled'}
              loading={state === 'loading'}
            >
              {sample[variant][0]}
            </Button>
          )}
        />
      ))}
    </div>
  ),
};

export const Playground: Story = {
  play: async ({ canvas, args, userEvent }) => {
    const button = canvas.getByRole('button', { name: '등록하기' });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
    // md: 높이 40 · label-lg
    await expect(getComputedStyle(button).height).toBe('40px');
    await expect(getComputedStyle(button).fontSize).toBe('14px');
  },
};

export const Secondary: Story = { args: { variant: 'secondary', children: '수정하기', iconLeft: 'edit' } };
export const Destructive: Story = { args: { variant: 'destructive', children: '삭제하기', iconLeft: 'delete' } };
export const IconRight: Story = { args: { iconLeft: undefined, iconRight: 'chevron-right', children: '다음' } };
export const LabelOnly: Story = { args: { iconLeft: undefined } };

export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvas }) => {
    // 로딩: 좌측 아이콘을 스피너로 대체, 레이블 유지 · 클릭 불가
    const button = canvas.getByRole('button', { name: '등록하기' });
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button.querySelector('.animate-spin')).not.toBeNull();
    await expect(button).toBeDisabled();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button')).toBeDisabled();
  },
};
