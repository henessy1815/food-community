import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, waitFor } from 'storybook/test';
import { TextField } from '@/components/ui/TextField';
import { iconNames } from '@/components/foundations/Icon';
import { Matrix } from './Matrix';

const meta = {
  title: 'Components/Form/TextField',
  component: TextField,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="w-[240px]"><Story /></div>],
  argTypes: {
    type: { control: 'inline-radio', options: ['text', 'password'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    iconLeft: { control: 'select', options: [undefined, ...iconNames] },
    iconRight: { control: 'select', options: [undefined, ...iconNames] },
  },
  args: {
    label: '맛집 이름',
    placeholder: '가게 이름을 입력해주세요',
    helperText: '최대 50자까지 입력할 수 있어요',
    size: 'md',
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

const states = ['default', 'focused', 'disabled', 'error'] as const;
const sizes = ['sm', 'md', 'lg'] as const;

const content = {
  text: {
    label: '맛집 이름',
    placeholder: '가게 이름을 입력해주세요',
    helperText: '최대 50자까지 입력할 수 있어요',
    errorMessage: '맛집 이름을 입력해주세요.',
    value: '바지락 칼국수',
  },
  password: {
    label: '비밀번호',
    placeholder: '비밀번호를 입력해주세요',
    helperText: '영문, 숫자를 포함해 8자 이상',
    errorMessage: '비밀번호가 일치하지 않아요.',
    value: 'password1',
  },
} as const;

export const Overview: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex flex-col gap-[40px]">
      {(['text', 'password'] as const).map((type) => (
        <Matrix
          key={type}
          title={type}
          rows={sizes}
          cols={states}
          rowLabel={(s) => `${s} · ${{ sm: 32, md: 40, lg: 48 }[s]}`}
          render={(size, state) => {
            const c = content[type];
            return (
              <div className="w-[240px]">
                <TextField
                  type={type}
                  size={size}
                  label={c.label}
                  placeholder={c.placeholder}
                  helperText={c.helperText}
                  errorMessage={state === 'error' ? c.errorMessage : undefined}
                  disabled={state === 'disabled'}
                  focused={state === 'focused'}
                  defaultValue={state === 'focused' ? c.value : undefined}
                  passwordToggle={type === 'password'}
                  readOnly
                />
              </div>
            );
          }}
        />
      ))}
    </div>
  ),
};

export const Playground: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('맛집 이름');
    await userEvent.type(input, '바지락 칼국수');
    await expect(input).toHaveValue('바지락 칼국수');
    // 포커스 시 보더가 color-border-brand로 전환
    const box = input.parentElement!;
    await waitFor(() => expect(getComputedStyle(box).borderColor).toBe('rgb(255, 90, 54)'));
  },
};

export const WithIcons: Story = { args: { iconLeft: 'search', iconRight: 'close', label: '검색', placeholder: '맛집 검색' } };

export const Error: Story = {
  args: { errorMessage: '맛집 이름을 입력해주세요.' },
  play: async ({ canvas }) => {
    // 에러 메시지가 힌트를 대체하고 입력과 연결됨
    await expect(canvas.queryByText('최대 50자까지 입력할 수 있어요')).toBeNull();
    const input = canvas.getByLabelText('맛집 이름');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('맛집 이름을 입력해주세요.');
  },
};

export const Disabled: Story = { args: { disabled: true } };

export const Password: Story = {
  args: {
    type: 'password',
    label: '비밀번호',
    placeholder: '비밀번호를 입력해주세요',
    helperText: '영문, 숫자를 포함해 8자 이상',
    iconLeft: 'lock',
    passwordToggle: true,
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('비밀번호');
    await userEvent.type(input, 'secret12');
    await expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(canvas.getByRole('button', { name: '비밀번호 보기' }));
    await expect(input).toHaveAttribute('type', 'text');
  },
};

/** 값이 있으면 우측 지우기 버튼 노출 — 검색·닉네임 입력 */
export const Clearable: Story = {
  args: { label: '검색', placeholder: '맛집 검색', iconLeft: 'search', helperText: undefined, size: 'lg' },
  render: function Render(args) {
    const [value, setValue] = useState('칼국수');
    return <TextField {...args} value={value} onChange={(e) => setValue(e.target.value)} onClear={() => setValue('')} />;
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('검색');
    await expect(input).toHaveValue('칼국수');
    await userEvent.click(canvas.getByRole('button', { name: '입력 지우기' }));
    await expect(input).toHaveValue('');
    await expect(canvas.queryByRole('button', { name: '입력 지우기' })).toBeNull();
  },
};
