import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, waitFor } from 'storybook/test';
import { Checkbox, CheckboxGroup } from '@/components/ui/Checkbox';
import { Matrix } from './Matrix';

const meta = {
  title: 'Components/Form/Checkbox',
  component: Checkbox,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
  args: { label: '주차 가능', size: 'sm' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

const selections = ['unchecked', 'checked', 'indeterminate'] as const;
const states = ['default', 'disabled', 'error'] as const;

export const Overview: Story = {
  render: () => (
    <div className="flex flex-col gap-[40px]">
      {(['sm', 'md'] as const).map((size) => (
        <Matrix
          key={size}
          title={`${size} · ${size === 'sm' ? 16 : 20}`}
          rows={selections}
          cols={states}
          render={(selection, state) => (
            <Checkbox
              size={size}
              label="주차 가능"
              readOnly
              checked={selection !== 'unchecked'}
              indeterminate={selection === 'indeterminate'}
              disabled={state === 'disabled'}
              error={state === 'error'}
            />
          )}
        />
      ))}
    </div>
  ),
};

export const Playground: Story = {
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', { name: '주차 가능' });
    await userEvent.click(canvas.getByText('주차 가능'));
    await expect(checkbox).toBeChecked();
    // 체크 시 color-background-brand
    await waitFor(() =>
      expect(getComputedStyle(checkbox.nextElementSibling!).backgroundColor).toBe('rgb(255, 90, 54)'),
    );
  },
};

export const Indeterminate: Story = {
  args: { indeterminate: true, checked: true, readOnly: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox')).toBePartiallyChecked();
  },
};

export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };

/** 단독 사용 시 에러 메시지는 체크박스 아래 */
export const StandaloneError: Story = {
  args: { label: '이용약관에 동의합니다', errorMessage: '약관에 동의해주세요.' },
};

/** 그룹 사용 시 에러 메시지는 전체 그룹 아래 1번만 */
export const Group: Story = {
  render: function Render() {
    const options = ['주차 가능', '아이 의자', '반려동물 동반', '단체석'];
    const [checked, setChecked] = useState<string[]>([]);
    const all = checked.length === options.length;
    return (
      <CheckboxGroup legend="편의 시설" errorMessage={checked.length ? undefined : '하나 이상 선택해주세요.'}>
        <Checkbox
          label="전체 선택"
          checked={all}
          indeterminate={checked.length > 0 && !all}
          onChange={() => setChecked(all ? [] : options)}
        />
        {options.map((o) => (
          <Checkbox
            key={o}
            label={o}
            error={!checked.length}
            checked={checked.includes(o)}
            onChange={() => setChecked((c) => (c.includes(o) ? c.filter((x) => x !== o) : [...c, o]))}
          />
        ))}
      </CheckboxGroup>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getAllByRole('alert')).toHaveLength(1);
    await userEvent.click(canvas.getByText('주차 가능'));
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvas.getByRole('checkbox', { name: '전체 선택' })).toBePartiallyChecked();
  },
};
