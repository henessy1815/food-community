import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn } from 'storybook/test';
import { FileDropzone, FileItem, FileUploader, type UploadedFile } from '@/components/ui/FileUploader';
import { Matrix } from './Matrix';

const THUMB = '/images/sample-food.png';
const HELPER = 'JPG · PNG, 장당 10MB 이하, 최대 5장';

const meta = {
  title: 'Components/Form/FileUploader',
  component: FileUploader,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="w-[344px]"><Story /></div>],
  args: { helperText: HELPER, accept: 'image/png,image/jpeg', files: [], onFiles: fn(), onRemove: fn() },
} satisfies Meta<typeof FileUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex flex-col gap-[40px]">
      <Matrix
        title="Dropzone"
        rows={['dropzone'] as const}
        cols={['default', 'dragover', 'disabled', 'error'] as const}
        render={(_, state) => (
          <div className="w-[256px]">
            <FileDropzone
              helperText={HELPER}
              dragover={state === 'dragover'}
              disabled={state === 'disabled'}
              errorMessage={state === 'error' ? '10MB가 넘는 사진은 올릴 수 없어요.' : undefined}
            />
          </div>
        )}
      />
      <Matrix
        title="File Item"
        rows={['file item'] as const}
        cols={['uploading', 'complete', 'error'] as const}
        render={(_, status) => (
          <div className="w-[344px]">
            <FileItem
              name="bajirak_kalguksu.jpg"
              status={status}
              thumbnailUrl={THUMB}
              meta={
                { uploading: '2.4MB · 업로드 중 60%', complete: '2.4MB · 업로드 완료', error: '14.2MB · 10MB를 넘어 올릴 수 없어요' }[status]
              }
              onRemove={() => {}}
            />
          </div>
        )}
      />
    </div>
  ),
};

const initialFiles: UploadedFile[] = [
  { id: '1', name: 'bajirak_kalguksu.jpg', meta: '2.4MB · 업로드 완료', status: 'complete', thumbnailUrl: THUMB },
  { id: '2', name: 'kimchi.jpg', meta: '1.8MB · 업로드 중 60%', status: 'uploading', thumbnailUrl: THUMB },
  { id: '3', name: 'menu_board.png', meta: '14.2MB · 10MB를 넘어 올릴 수 없어요', status: 'error', thumbnailUrl: THUMB },
];

/** 드롭존 + 파일선택버튼 + 파일 아이템 리스트 */
export const Composition: Story = {
  render: function Render(args) {
    const [files, setFiles] = useState(initialFiles);
    return (
      <FileUploader
        {...args}
        files={files}
        errorMessage={files.some((f) => f.status === 'error') ? '10MB가 넘는 사진은 올릴 수 없어요.' : undefined}
        onRemove={(id) => setFiles((fs) => fs.filter((f) => f.id !== id))}
      />
    );
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('10MB');
    await expect(canvas.getByRole('img', { name: '업로드 중' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'menu_board.png 삭제' }));
    await expect(canvas.queryByText('menu_board.png')).toBeNull();
    // 에러 파일을 지우면 안내 문구로 복귀
    await expect(canvas.getByText(HELPER)).toBeVisible();
  },
};

export const SelectFile: Story = {
  play: async ({ canvas, canvasElement, args, userEvent }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    await userEvent.upload(input, file);
    await expect(args.onFiles).toHaveBeenCalledWith([file]);
    await expect(canvas.getByRole('button', { name: '파일 선택' })).toBeEnabled();
  },
};

export const Disabled: Story = { args: { disabled: true } };
