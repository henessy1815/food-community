import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import {
  colorScales,
  colorSteps,
  primitiveColors,
  semanticColors,
  spacingTokens,
  typographyPrimitives,
} from '@/styles/tokens';

const meta = {
  title: 'Foundations/Design Tokens',
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function TokenTable({ title, rows }: { title: string; rows: [string, string, string?][] }) {
  return (
    <section className="flex flex-col gap-[12px]">
      <h2 className="heading-md">{title}</h2>
      <table className="w-full border-collapse body-md">
        <thead>
          <tr className="border-b border-border-strong text-left label-lg text-text-secondary">
            <th className="py-[8px] pr-[16px]">Token</th>
            <th className="py-[8px] pr-[16px]">Value</th>
            <th className="py-[8px]">CSS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([token, value, preview]) => (
            <tr key={token} className="border-b border-border-default">
              <td className="py-[8px] pr-[16px] font-mono text-text-default">{token}</td>
              <td className="py-[8px] pr-[16px] text-text-body">
                <span className="inline-flex items-center gap-[8px]">
                  {preview && (
                    <span
                      className="size-[16px] rounded-[4px] border border-border-default"
                      style={{ background: preview }}
                    />
                  )}
                  {value}
                </span>
              </td>
              <td className="py-[8px] font-mono text-text-secondary">{`var(--${token})`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const primitiveRows = colorScales.flatMap((scale) =>
  colorSteps.map(
    (step) =>
      [`color-${scale}-${step}`, primitiveColors[scale][step], `var(--color-${scale}-${step})`] as [string, string, string],
  ),
);

const semanticRows = Object.values(semanticColors).flatMap((group) =>
  Object.entries(group).map(
    ([token, ref]) => [token, `→ ${ref}`, `var(--${token})`] as [string, string, string],
  ),
);

const typographyRows: [string, string][] = [
  ['font-family', typographyPrimitives['font-family']],
  ...Object.entries(typographyPrimitives.fontSize).map(([k, v]) => [k, `${v}px`] as [string, string]),
  ...Object.entries(typographyPrimitives.fontWeight).map(([k, v]) => [k, `${v}`] as [string, string]),
  ...Object.entries(typographyPrimitives.lineHeight).map(([k, v]) => [k, `${v}`] as [string, string]),
  ['font-letter-spacing', typographyPrimitives.letterSpacing],
];

const spacingRows = Object.entries(spacingTokens).map(([k, v]) => [k, `${v}px`] as [string, string]);

export const AllTokens: Story = {
  render: () => (
    <div className="flex max-w-[960px] flex-col gap-[40px]">
      <header className="flex flex-col gap-[8px]">
        <p className="label-lg text-text-brand">FOUNDATION · TOKENS</p>
        <h1 className="display-sm">디자인 토큰</h1>
        <p className="body-lg text-text-secondary">
          design.pen Variables를 CSS 변수로 1:1 옮긴 목록입니다. 컬러는 Tailwind 유틸리티로도
          쓸 수 있습니다. 예: <code>bg-brand-500</code>, <code>text-text-secondary</code>,{' '}
          <code>border-border-default</code>
        </p>
      </header>
      <TokenTable title={`Color · Primitive (${primitiveRows.length})`} rows={primitiveRows} />
      <TokenTable title={`Color · Semantic (${semanticRows.length})`} rows={semanticRows} />
      <TokenTable title="Typography" rows={typographyRows} />
      <TokenTable title="Spacing" rows={spacingRows} />
    </div>
  ),
  // tokens.css(실제 스타일)와 tokens.ts(문서 메타데이터)가 어긋나지 않는지 검증
  play: async ({ canvasElement }) => {
    const probe = document.createElement('div');
    canvasElement.appendChild(probe);
    const resolve = (cssVar: string) => {
      probe.style.backgroundColor = `var(${cssVar})`;
      return getComputedStyle(probe).backgroundColor;
    };
    const toRgb = (hex: string) =>
      `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;

    for (const scale of colorScales) {
      for (const step of colorSteps) {
        await expect(resolve(`--color-${scale}-${step}`), `color-${scale}-${step}`).toBe(
          toRgb(primitiveColors[scale][step]),
        );
      }
    }
    for (const group of Object.values(semanticColors)) {
      for (const [token, ref] of Object.entries(group)) {
        await expect(resolve(`--${token}`), token).toBe(resolve(`--${ref}`));
      }
    }

    const root = getComputedStyle(document.documentElement);
    for (const [token, px] of Object.entries(typographyPrimitives.fontSize)) {
      await expect(root.getPropertyValue(`--${token}`).trim(), token).toBe(`${px}px`);
    }
    for (const [token, px] of Object.entries(spacingTokens)) {
      await expect(root.getPropertyValue(`--${token}`).trim(), token).toBe(`${px}px`);
    }
    probe.remove();
  },
};
