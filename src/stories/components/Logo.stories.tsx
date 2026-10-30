import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { Logo } from '@/components/ui/Logo';
import { TopNavigation } from '@/components/ui/TopNavigation';

const meta = {
  title: 'Components/Display/Logo',
  component: Logo,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: 'inline-radio', options: ['md', 'lg', 'xl'] },
    tone: { control: 'inline-radio', options: ['default', 'inverse'] },
  },
  args: { size: 'md' },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 상단 내비게이션용 */
export const Medium: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/구로/)).toHaveTextContent('구로 맛길');
  },
};

/** 로그인 화면용 — 워드마크를 페이지 제목(h1)으로 */
export const Large: Story = {
  args: { size: 'lg', as: 'h1', tagline: '주말 맛집 드라이브' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: '구로 맛길' })).toBeVisible();
    await expect(canvas.getByText('주말 맛집 드라이브')).toBeVisible();
  },
};

/** 로그인 화면용 — 세로 락업 + 영문 레터링, 실사 배경 위(inverse) */
export const Hero: Story = {
  args: { size: 'xl', tone: 'inverse', as: 'h1' },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex min-h-[360px] items-center justify-center bg-background-inverse">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: '구로 맛길' })).toBeVisible();
    await expect(canvas.getByText('GURO MATGIL')).toBeVisible();
  },
};

/** 홈 상단 내비게이션에 넣은 모습 */
export const InTopNavigation: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => <TopNavigation title={<Logo />} rightActions={[{ icon: 'user', label: '마이 페이지' }]} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { name: '구로 맛길' })).toBeVisible();
  },
};
