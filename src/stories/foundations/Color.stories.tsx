import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import {
  colorScaleMeta,
  colorScales,
  colorSteps,
  contrastRatio,
  primitiveColors,
  semanticColors,
} from '@/styles/tokens';

const meta = {
  title: 'Foundations/Color',
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const WHITE = primitiveColors.neutral[50];

function ContrastBadge({ hex }: { hex: string }) {
  const ratio = contrastRatio(hex, WHITE);
  const level = ratio >= 4.5 ? 'AA' : ratio >= 3 ? '3:1' : null;
  return (
    <span className="flex items-center gap-[4px] label-md text-text-secondary">
      {ratio.toFixed(2)}
      {level && (
        <span className="rounded-[4px] bg-background-inverse px-[4px] text-text-inverse">{level}</span>
      )}
    </span>
  );
}

export const Primitive: Story = {
  render: () => (
    <div className="flex max-w-[1200px] flex-col gap-[32px]">
      <header className="flex flex-col gap-[8px]">
        <p className="label-lg text-text-brand">FOUNDATION · COLOR</p>
        <h1 className="display-sm">컬러 프리미티브 토큰</h1>
        <p className="body-lg text-text-secondary">
          6개 팔레트 × 11단계. 각 칸의 숫자는 color-neutral-50(#FFFFFF) 대비 명도 대비율이며,
          3:1(그래픽·큰 텍스트)과 AA 4.5:1(본문 텍스트)을 만족하는 단계를 표시합니다.
        </p>
      </header>
      {colorScales.map((scale) => (
        <section key={scale} className="flex gap-[24px]" aria-label={`${colorScaleMeta[scale].label} palette`}>
          <div className="flex w-[140px] shrink-0 flex-col gap-[4px]">
            <h2 className="heading-sm">{colorScaleMeta[scale].label}</h2>
            <p className="label-md text-text-secondary">color-{scale}-*</p>
            <p className="label-md text-text-tertiary">{colorScaleMeta[scale].role}</p>
          </div>
          <div className="grid flex-1 grid-cols-11 gap-[8px]">
            {colorSteps.map((step) => {
              const hex = primitiveColors[scale][step];
              return (
                <div key={step} className="flex flex-col gap-[6px]">
                  <div
                    data-testid={`swatch-${scale}-${step}`}
                    className="aspect-square w-full rounded-[8px] border border-border-default"
                    style={{ background: `var(--color-${scale}-${step})` }}
                  />
                  <span className="label-lg">{step}</span>
                  <span className="label-md text-text-secondary">{hex}</span>
                  <ContrastBadge hex={hex} />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    // 브랜드 500 스와치가 tokens.css의 #FF5A36으로 렌더되는지 — Tailwind/전역 CSS 로드 확인
    await expect(getComputedStyle(canvas.getByTestId('swatch-brand-500')).backgroundColor).toBe(
      'rgb(255, 90, 54)',
    );
    // 시맨틱 유틸리티(text-text-brand → brand-500)도 해석되는지
    await expect(getComputedStyle(canvas.getByText('FOUNDATION · COLOR')).color).toBe('rgb(255, 90, 54)');
  },
};

const groupLabels: Record<keyof typeof semanticColors, string> = {
  text: 'Text',
  background: 'Background',
  border: 'Border',
  shadow: 'Shadow',
};

function SemanticPreview({ group, token }: { group: keyof typeof semanticColors; token: string }) {
  const value = `var(--${token})`;
  if (group === 'text') {
    const onDark = token === 'color-text-inverse' || token === 'color-text-on-brand';
    return (
      <div
        className={`flex h-[56px] items-center justify-center rounded-[8px] border border-border-default heading-md ${onDark ? 'bg-background-inverse' : 'bg-background-default'}`}
        style={{ color: value }}
      >
        가나다 Aa
      </div>
    );
  }
  if (group === 'border') {
    return <div className="h-[56px] rounded-[8px] border-2 bg-background-default" style={{ borderColor: value }} />;
  }
  if (group === 'shadow') {
    return (
      <div
        className="h-[56px] rounded-[8px] bg-background-default"
        style={{ boxShadow: `0 4px 16px ${value}` }}
      />
    );
  }
  return <div className="h-[56px] rounded-[8px] border border-border-default" style={{ background: value }} />;
}

export const Semantic: Story = {
  render: () => (
    <div className="flex max-w-[1200px] flex-col gap-[40px]">
      <header className="flex flex-col gap-[8px]">
        <p className="label-lg text-text-brand">FOUNDATION · COLOR</p>
        <h1 className="display-sm">컬러 시맨틱 토큰</h1>
        <p className="body-lg text-text-secondary">
          시맨틱 토큰은 hex를 직접 갖지 않고 프리미티브 토큰만 참조합니다. 컴포넌트는 시맨틱 토큰을
          사용하세요.
        </p>
      </header>
      {(Object.keys(semanticColors) as (keyof typeof semanticColors)[]).map((group) => (
        <section key={group} className="flex flex-col gap-[16px]">
          <h2 className="heading-md">{groupLabels[group]}</h2>
          <div className="grid grid-cols-4 gap-[16px]">
            {Object.entries(semanticColors[group]).map(([token, ref]) => (
              <div key={token} className="flex flex-col gap-[8px]">
                <SemanticPreview group={group} token={token} />
                <div className="flex flex-col">
                  <span className="label-lg">{token}</span>
                  <span className="label-md text-text-secondary">→ {ref}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};
