import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';
import { Empty } from '@/components/ui/Empty';

const meta = {
  title: 'Components/Display/Empty',
  component: Empty,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="w-[320px]"><Story /></div>],
  args: {
    visual: 'utensils',
    title: '아직 등록된 맛집이 없어요',
    description: '우리 동네 단골 맛집을 첫 번째로 소개해보세요.',
    secondaryAction: { label: '둘러보기', onClick: fn() },
    primaryAction: { label: '맛집 등록', icon: 'plus', onClick: fn() },
  },
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '맛집 등록' }));
    await expect(args.primaryAction?.onClick).toHaveBeenCalled();
  },
};

export const SearchNoResult: Story = {
  args: {
    visual: 'search',
    title: '검색 결과가 없어요',
    description: '다른 키워드로 다시 검색해보세요.',
    primaryAction: undefined,
    secondaryAction: undefined,
  },
};

export const TitleOnly: Story = {
  args: { visual: undefined, description: undefined, primaryAction: undefined, secondaryAction: undefined },
};
