import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Textarea } from '@/components/ui/Textarea';
import { Matrix } from './Matrix';

const LONG =
  '바지락이 듬뿍 들어간 칼국수집이에요. 국물이 진하고 겉절이가 맛있어요. 가게 앞에 3대 주차 가능하고, 아이 의자도 있어요. 주말 점심에는 대기가 30분 정도 있으니 조금 일찍 가는 걸 추천해요.';

const meta = {
  title: 'Components/Form/Textarea',
  component: Textarea,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="w-[256px]"><Story /></div>],
  args: {
    label: '맛집 내용',
    placeholder: '맛집을 소개하는 내용을 입력해주세요',
    helperText: '주차 정보가 있으면 도움이 돼요',
    maxLength: 2000,
    showCounter: true,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  decorators: [(Story) => <Story />],
  render: (args) => (
    <Matrix
      rows={['textarea'] as const}
      cols={['default', 'focused', 'disabled', 'error'] as const}
      render={(_, state) => (
        <div className="w-[256px]">
          <Textarea
            {...args}
            readOnly
            focused={state === 'focused'}
            disabled={state === 'disabled'}
            errorMessage={state === 'error' ? '10자 이상 입력해주세요.' : undefined}
            defaultValue={state === 'focused' ? LONG : state === 'error' ? '맛있어요' : undefined}
          />
        </div>
      )}
    />
  ),
};

export const Playground: Story = {
  play: async ({ canvas, userEvent }) => {
    const textarea = canvas.getByLabelText('맛집 내용');
    await userEvent.type(textarea, '국물이 진해요');
    // 하단 우측 글자수 카운터
    await expect(canvas.getByText('7 / 2,000')).toBeVisible();
  },
};

export const Scrollable: Story = {
  args: { defaultValue: LONG },
  play: async ({ canvas }) => {
    // 고정 높이 3줄, 내용 초과 시 스크롤
    const textarea = canvas.getByLabelText('맛집 내용');
    await expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight);
    await expect(getComputedStyle(textarea).overflowY).toBe('auto');
  },
};

export const Error: Story = { args: { defaultValue: '맛있어요', errorMessage: '10자 이상 입력해주세요.' } };
export const Disabled: Story = { args: { disabled: true } };
export const WithoutCounter: Story = { args: { showCounter: false } };
