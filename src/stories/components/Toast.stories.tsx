import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { Toast } from '@/components/ui/Toast';
import { Matrix } from './Matrix';

const messages = {
  success: '맛집이 등록됐어요',
  error: '사진 업로드에 실패했어요',
  info: '새로운 맛집 3곳이 추가됐어요',
  warning: '네트워크 연결이 불안정해요',
} as const;

const meta = {
  title: 'Components/Feedback/Toast',
  component: Toast,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: { type: { control: 'inline-radio', options: ['success', 'error', 'info', 'warning'] } },
  args: { type: 'success', children: messages.success, onClose: fn() },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <Matrix
      rows={['success', 'error', 'info', 'warning'] as const}
      cols={['default'] as const}
      render={(type) => (
        <Toast type={type} onClose={() => {}}>
          {messages[type]}
        </Toast>
      )}
    />
  ),
};

export const Playground: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(messages.success);
    await userEvent.click(canvas.getByRole('button', { name: '닫기' }));
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const Error: Story = {
  args: { type: 'error', children: messages.error },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toBeVisible();
  },
};

export const WithoutClose: Story = { args: { type: 'info', children: messages.info, onClose: undefined } };

/** 모바일: 화면 너비 - 좌우 마진 */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1' } },
  render: (args) => (
    <div className="w-[360px] px-[16px]">
      <Toast {...args} />
    </div>
  ),
};
