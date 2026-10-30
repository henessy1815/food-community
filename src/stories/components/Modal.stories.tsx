import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const meta = {
  title: 'Components/Overlay/Modal',
  component: Modal,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  args: {
    open: true,
    onClose: fn(),
    title: '맛집 등록을 그만둘까요?',
    children: '지금 나가면 작성 중인 내용과 올린 사진이 저장되지 않아요.',
    secondaryAction: { label: '계속 작성' },
    primaryAction: { label: '나가기' },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole('dialog', { name: '맛집 등록을 그만둘까요?' });
    await expect(dialog).toHaveAccessibleDescription(/저장되지 않아요/);
    // 스크림을 탭하면 닫힘
    await userEvent.click(body.getByTestId('modal-scrim'));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(within(dialog).getByRole('button', { name: '닫기' }));
    await expect(args.onClose).toHaveBeenCalledTimes(2);
  },
};

export const Destructive: Story = {
  args: {
    title: '맛집을 삭제할까요?',
    children: '삭제한 맛집은 되돌릴 수 없어요.',
    secondaryAction: { label: '취소' },
    primaryAction: { label: '삭제', destructive: true },
  },
};

export const Interactive: Story = {
  args: { open: false },
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>모달 열기</Button>
        <Modal
          {...args}
          open={open}
          onClose={close}
          secondaryAction={{ label: '계속 작성', onClick: close }}
          primaryAction={{ label: '나가기', onClick: close }}
        />
      </>
    );
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: '모달 열기' }));
    await body.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
    // 닫히면 트리거로 포커스 복원
    await expect(canvas.getByRole('button', { name: '모달 열기' })).toHaveFocus();
  },
};
