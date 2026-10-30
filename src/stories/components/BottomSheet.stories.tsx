import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

const meta = {
  title: 'Components/Overlay/BottomSheet',
  component: BottomSheet,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  args: {
    open: true,
    onClose: fn(),
    label: '콘텐츠 영역',
    children: (
      <>
        <p className="heading-sm">콘텐츠 영역</p>
        <p className="body-md text-text-secondary">바텀시트에 표시할 콘텐츠를 이 영역에 배치합니다.</p>
      </>
    ),
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await body.findByRole('dialog', { name: '콘텐츠 영역' });
    // 스크림을 탭하면 선택 없이 닫힘
    await userEvent.click(body.getByTestId('sheet-scrim'));
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const Interactive: Story = {
  args: { open: false },
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>바텀시트 열기</Button>
        <BottomSheet {...args} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: '바텀시트 열기' }));
    await body.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
  },
};
