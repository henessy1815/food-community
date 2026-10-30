import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, waitFor, within } from 'storybook/test';
import { Select } from '@/components/ui/Select';
import { Matrix } from './Matrix';

const options = [
  { value: 'korean', label: '한식' },
  { value: 'chinese', label: '중식' },
  { value: 'japanese', label: '일식' },
  { value: 'western', label: '양식' },
  { value: 'cafe', label: '카페', disabled: true },
];

const meta = {
  title: 'Components/Form/Select',
  component: Select,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="h-[320px] w-[240px]"><Story /></div>],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    presentation: { control: 'inline-radio', options: ['auto', 'dropdown', 'sheet'] },
  },
  args: {
    options,
    label: '카테고리',
    placeholder: '카테고리를 선택해주세요',
    helperText: '맛집 종류를 하나 골라주세요',
    size: 'md',
    presentation: 'dropdown',
    onValueChange: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  decorators: [(Story) => <Story />],
  render: (args) => (
    <Matrix
      rows={['sm', 'md', 'lg'] as const}
      cols={['default', 'focused', 'disabled', 'error'] as const}
      rowLabel={(s) => `${s} · ${{ sm: 32, md: 40, lg: 48 }[s]}`}
      render={(size, state) => (
        <div className="w-[240px]">
          <Select
            {...args}
            size={size}
            focused={state === 'focused'}
            defaultValue={state === 'focused' ? 'korean' : undefined}
            disabled={state === 'disabled'}
            errorMessage={state === 'error' ? '카테고리를 선택해주세요.' : undefined}
          />
        </div>
      )}
    />
  ),
};

/** 데스크톱: 셀렉트 아래에 셀렉트아이템 · 패널이 열린 동안 focused 유지 */
export const Dropdown: Story = {
  play: async ({ canvas, args, userEvent }) => {
    const trigger = canvas.getByRole('combobox', { name: /카테고리/ });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(getComputedStyle(trigger).borderColor).toBe('rgb(255, 90, 54)'));
    await userEvent.click(canvas.getByRole('option', { name: '중식' }));
    await expect(args.onValueChange).toHaveBeenCalledWith('chinese');
    await expect(trigger).toHaveTextContent('중식');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const Keyboard: Story = {
  play: async ({ canvas, args, userEvent }) => {
    canvas.getByRole('combobox').focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}');
    await expect(args.onValueChange).toHaveBeenCalledWith('japanese');
  },
};

/** 모바일: 바텀시트 내 셀렉트아이템 */
export const MobileSheet: Story = {
  args: { presentation: 'sheet' },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox'));
    const body = within(canvasElement.ownerDocument.body);
    const sheet = await body.findByRole('dialog', { name: '카테고리' });
    await userEvent.click(within(sheet).getByRole('option', { name: '양식' }));
    await expect(canvas.getByRole('combobox')).toHaveTextContent('양식');
  },
};

export const Error: Story = { args: { errorMessage: '카테고리를 선택해주세요.' } };
export const Disabled: Story = { args: { disabled: true } };
