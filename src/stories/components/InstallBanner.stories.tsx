import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { InstallGuide } from '@/components/pwa/InstallGuide';

const meta = {
  title: 'Components/Feedback/InstallBanner',
  component: InstallBanner,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  argTypes: { platform: { control: 'inline-radio', options: ['android', 'ios', 'kakao'] } },
  args: { platform: 'android', onInstall: fn(), onDismiss: fn() },
} satisfies Meta<typeof InstallBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 안드로이드 — 배너 탭 시 바로 설치 프롬프트 */
export const Android: Story = {
  play: async ({ canvas, args, userEvent }) => {
    const banner = canvas.getByRole('complementary', { name: '앱 설치 안내' });
    await expect(within(banner).getByText('설치')).toBeVisible();
    await userEvent.click(within(banner).getByRole('button', { name: /구로 맛길 앱 설치하기/ }));
    await expect(args.onInstall).toHaveBeenCalled();
    await userEvent.click(within(banner).getByRole('button', { name: '설치 안내 닫기' }));
    await expect(args.onDismiss).toHaveBeenCalled();
  },
};

/** iOS — 배너 탭 시 바텀시트로 홈 화면 추가 가이드 */
export const IOS: Story = {
  args: { platform: 'ios' },
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <InstallBanner
          {...args}
          onInstall={() => {
            args.onInstall();
            setOpen(true);
          }}
        />
        <InstallGuide platform="ios" open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: /설치 방법/ }));
    const sheet = await body.findByRole('dialog', { name: '홈 화면에 추가하는 방법' });
    await expect(within(sheet).getAllByRole('listitem')).toHaveLength(3);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull());
  },
};

/** 카카오톡 인앱 브라우저 — 설치 불가라 외부 브라우저로 열기 유도 */
export const Kakao: Story = {
  args: { platform: 'kakao' },
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /브라우저로 열기/ }));
    await expect(args.onInstall).toHaveBeenCalled();
  },
};

/** iOS 가이드 바텀시트 단독 */
export const IOSGuide: Story = {
  render: () => <InstallGuide platform="ios" open onClose={fn()} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const sheet = await body.findByRole('dialog', { name: '홈 화면에 추가하는 방법' });
    await expect(within(sheet).getByText(/홈 화면에 추가’ 선택/)).toBeVisible();
  },
};

/** 안드로이드 가이드 — 설치 프롬프트를 주지 않는 브라우저(삼성 인터넷 등)용 */
export const AndroidGuide: Story = {
  render: () => <InstallGuide platform="android" open onClose={fn()} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const sheet = await body.findByRole('dialog', { name: '홈 화면에 추가하는 방법' });
    await expect(within(sheet).getAllByRole('listitem')).toHaveLength(3);
    await expect(within(sheet).getByText(/현재 페이지 추가/)).toBeVisible();
  },
};
