import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Icon, iconNames, iconSizes } from '@/components/foundations/Icon';

const meta = {
  title: 'Foundations/Iconography',
  component: Icon,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: {
    name: { control: 'select', options: iconNames },
    size: { control: 'inline-radio', options: iconSizes },
  },
  args: { name: 'heart', size: 24 },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

const ROWS_PER_COLUMN = 20;
const columns = Array.from({ length: Math.ceil(iconNames.length / ROWS_PER_COLUMN) }, (_, i) =>
  iconNames.slice(i * ROWS_PER_COLUMN, (i + 1) * ROWS_PER_COLUMN),
);

export const Library: Story = {
  render: () => (
    <div className="flex flex-col gap-[24px]">
      <header className="flex max-w-[960px] flex-col gap-[8px]">
        <p className="label-lg text-text-brand">FOUNDATION · ICONOGRAPHY</p>
        <h1 className="display-sm">아이코노그래피</h1>
        <p className="body-lg text-text-secondary">
          Lucide 아이콘 기반 ({iconNames.length}종 × 16 · 20 · 24 · 32). <code>-fill</code> 아이콘은
          Phosphor fill을 사용합니다. 색상은 <code>currentColor</code>를 따르며 기본값은
          color-text-default입니다.
        </p>
      </header>
      <div className="flex gap-[48px]">
        {columns.map((names, i) => (
          <table key={i} className="border-collapse">
            <thead>
              <tr className="border-b border-border-strong label-md text-text-secondary">
                <th className="py-[8px] pr-[24px] text-left">Name</th>
                {iconSizes.map((s) => (
                  <th key={s} className="w-[48px] py-[8px]">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {names.map((name) => (
                <tr key={name} className="border-b border-border-default">
                  <td className="py-[8px] pr-[24px]">
                    <span className="block label-lg">{name}</span>
                    <span className="block label-md text-text-tertiary">icon-{name}-*</span>
                  </td>
                  {iconSizes.map((s) => (
                    <td key={s} className="py-[8px]">
                      <span className="flex items-center justify-center" data-testid={`icon-${name}-${s}`}>
                        <Icon name={name} size={s} />
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('row')).toHaveLength(iconNames.length + columns.length);
    for (const s of iconSizes) {
      const svg = canvas.getByTestId(`icon-arrow-left-${s}`).querySelector('svg')!;
      await expect(svg.getAttribute('width')).toBe(`${s}`);
      // 기본 색상은 body의 color-text-default(#191919)를 상속
      await expect(getComputedStyle(svg).color).toBe('rgb(25, 25, 25)');
    }
  },
};

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-[24px]">
      {iconSizes.map((s) => (
        <Icon key={s} {...args} size={s} />
      ))}
    </div>
  ),
};

export const Colored: Story = {
  args: { name: 'heart', className: 'text-text-brand' },
};

export const Filled: Story = { args: { name: 'bookmark-fill' } };

export const WithLabel: Story = {
  args: { name: 'search', label: '검색' },
  play: async ({ canvas }) => {
    // label을 주면 스크린리더에 이미지로 노출, 없으면 aria-hidden
    await expect(canvas.getByRole('img', { name: '검색' })).toBeInTheDocument();
  },
};
