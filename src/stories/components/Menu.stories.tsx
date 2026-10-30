import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, within } from 'storybook/test';
import { Menu } from '@/components/ui/Menu';
import { MenuItem } from '@/components/ui/MenuItem';
import { IconButton } from '@/components/ui/IconButton';

const onEdit = fn();
const onDelete = fn();

const meta = {
  title: 'Components/Overlay/Menu',
  component: Menu,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="flex h-[260px] w-[240px] justify-end"><Story /></div>],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    presentation: { control: 'inline-radio', options: ['auto', 'dropdown', 'sheet'] },
  },
  args: {
    presentation: 'dropdown',
    size: 'md',
    trigger: <IconButton icon="more-vertical" label="더보기" />,
    children: (
      <>
        <MenuItem icon="edit" onSelect={onEdit}>수정하기</MenuItem>
        <MenuItem icon="share">공유하기</MenuItem>
        <MenuItem icon="copy" disabled>링크 복사</MenuItem>
        <MenuItem icon="delete" type="destructive" onSelect={onDelete}>삭제하기</MenuItem>
      </>
    ),
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = { args: { defaultOpen: true } };

/** 데스크톱: 메뉴버튼 아래의 메뉴아이템 */
export const Dropdown: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: '더보기' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // 첫 항목에 포커스 → 화살표로 이동 (disabled 건너뜀)
    await expect(canvas.getByRole('menuitem', { name: '수정하기' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(canvas.getByRole('menuitem', { name: '삭제하기' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(onDelete).toHaveBeenCalled();
    await expect(canvas.queryByRole('menu')).toBeNull();
  },
};

/** 모바일: 바텀시트 내 메뉴아이템 */
export const MobileSheet: Story = {
  args: { presentation: 'sheet' },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '더보기' }));
    const body = within(canvasElement.ownerDocument.body);
    const sheet = await body.findByRole('dialog', { name: '메뉴' });
    await userEvent.click(within(sheet).getByRole('menuitem', { name: '수정하기' }));
    await expect(onEdit).toHaveBeenCalled();
    await expect(body.queryByRole('dialog')).toBeNull();
  },
};
