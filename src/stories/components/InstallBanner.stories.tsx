import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { IosInstallGuide } from '@/components/pwa/IosInstallGuide';

const meta = {
  title: 'Components/Feedback/InstallBanner',
  component: InstallBanner,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
  argTypes: { platform: { control: 'inline-radio', options: ['android', 'ios'] } },
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
        <IosInstallGuide open={open} onClose={() => setOpen(false)} />
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

/** iOS 가이드 바텀시트 단독 */
export const IOSGuide: Story = {
  render: () => <IosInstallGuide open onClose={fn()} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const sheet = await body.findByRole('dialog', { name: '홈 화면에 추가하는 방법' });
    await expect(within(sheet).getByText(/홈 화면에 추가’ 선택/)).toBeVisible();
  },
};
