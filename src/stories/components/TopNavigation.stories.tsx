import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { TopNavigation } from '@/components/ui/TopNavigation';
import { Button } from '@/components/ui/Button';

const back = fn();

const meta = {
  title: 'Components/Navigation/TopNavigation',
  component: TopNavigation,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="max-w-[360px] border border-border-default"><Story /></div>],
  args: {
    title: '맛집 상세',
    leftAction: { icon: 'arrow-left', label: '뒤로가기', onClick: back },
    rightActions: [{ icon: 'share', label: '공유하기' }],
  },
} satisfies Meta<typeof TopNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const header = canvas.getByRole('banner');
    await expect(getComputedStyle(header).height).toBe('56px');
    await expect(canvas.getByRole('heading', { name: '맛집 상세' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '뒤로가기' }));
    await expect(back).toHaveBeenCalled();
  },
};

export const TwoRightActions: Story = {
  args: { rightActions: [{ icon: 'share', label: '공유하기' }, { icon: 'more-vertical', label: '더보기' }] },
};

export const TitleOnly: Story = { args: { leftAction: undefined, rightActions: [], title: '우리 동네 맛집' } };

export const WithoutTitle: Story = { args: { title: undefined } };

/** 우측 커스텀 영역 — 상세 화면 작성자용 수정·삭제 버튼 */
export const WithTrailing: Story = {
  args: {
    title: undefined,
    rightActions: [],
    trailing: (
      <>
        <Button variant="secondary" size="sm" iconLeft="edit">수정</Button>
        <Button variant="destructive" size="sm" iconLeft="delete">삭제</Button>
      </>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '수정' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: '삭제' })).toBeVisible();
  },
};
