import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { BottomNavigation, type BottomNavigationItem } from '@/components/ui/BottomNavigation';

const items: BottomNavigationItem[] = [
  { value: 'home', label: '홈', icon: 'home', activeIcon: 'home-fill' },
  { value: 'map', label: '지도', icon: 'map-pin', activeIcon: 'map-pin-fill' },
  { value: 'saved', label: '저장', icon: 'bookmark', activeIcon: 'bookmark-fill' },
  { value: 'alarm', label: '알림', icon: 'notification', activeIcon: 'notification-fill' },
  { value: 'my', label: '마이', icon: 'user', activeIcon: 'user-fill' },
];

const meta = {
  title: 'Components/Navigation/BottomNavigation',
  component: BottomNavigation,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="max-w-[360px]"><Story /></div>],
  args: { items, defaultValue: 'home', onValueChange: fn() },
} satisfies Meta<typeof BottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    // 선택: 필 아이콘 · 브랜드 컬러 / 미선택: 아웃라인 · 뉴트럴
    const home = canvas.getByRole('button', { name: '홈' });
    await expect(home).toHaveAttribute('aria-current', 'page');
    await expect(getComputedStyle(home).color).toBe('rgb(255, 90, 54)');
    await expect(getComputedStyle(canvas.getByRole('button', { name: '지도' })).color).toBe('rgb(107, 107, 107)');
    await userEvent.click(canvas.getByRole('button', { name: '저장' }));
    await expect(args.onValueChange).toHaveBeenCalledWith('saved');
    await expect(canvas.getByRole('button', { name: '저장' })).toHaveAttribute('aria-current', 'page');
  },
};

export const ThreeItems: Story = { args: { items: items.slice(0, 3) } };
export const TwoItems: Story = { args: { items: [items[0], items[4]] } };
export const IconOnly: Story = { args: { showLabels: false } };
