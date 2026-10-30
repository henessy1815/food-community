import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { Text, textVariants } from '@/components/foundations/Text';
import { textStyles, typographyPrimitives } from '@/styles/tokens';

const SAMPLE = '오늘 뭐 먹지? 우리 동네 맛집 찾기';

const meta = {
  title: 'Foundations/Typography',
  component: Text,
  tags: ['ai-generated'],
  parameters: { layout: 'padded' },
  argTypes: {
    variant: { control: 'select', options: textVariants },
    as: { control: false },
  },
  args: { variant: 'body-lg', children: SAMPLE },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = {
  render: () => (
    <div className="flex max-w-[1100px] flex-col">
      <header className="flex flex-col gap-[8px] pb-[24px]">
        <p className="label-lg text-text-brand">FOUNDATION · TYPOGRAPHY</p>
        <h1 className="display-sm">타이포그래피 스케일</h1>
        <p className="body-lg text-text-secondary">
          {typographyPrimitives['font-family']} · 공통 자간 {typographyPrimitives.letterSpacing}. 클래스
          (<code>className=&quot;heading-md&quot;</code>) 또는 <code>&lt;Text variant=&quot;heading-md&quot; /&gt;</code>로
          사용합니다.
        </p>
      </header>
      {textVariants.map((variant) => {
        const s = textStyles[variant];
        return (
          <div
            key={variant}
            className="flex items-center gap-[40px] border-t border-border-default py-[24px]"
          >
            <div className="flex w-[260px] shrink-0 flex-col gap-[2px]">
              <span className="heading-sm">{variant}</span>
              <span className="label-md text-text-secondary">
                {typographyPrimitives.fontSize[s.size]}px · {typographyPrimitives.fontWeight[s.weight]} ·{' '}
                {typographyPrimitives.lineHeight[s.lineHeight]}
              </span>
              <span className="label-md text-text-tertiary">
                {s.size} / {s.weight} / {s.lineHeight}
              </span>
            </div>
            <Text variant={variant} as="p" data-testid={variant}>
              {SAMPLE}
            </Text>
          </div>
        );
      })}
    </div>
  ),
  play: async ({ canvas }) => {
    // 각 스타일이 토큰 값으로 계산되는지 (사이즈·두께·행간·자간 -2%·폰트)
    for (const variant of textVariants) {
      const s = textStyles[variant];
      const size = typographyPrimitives.fontSize[s.size];
      const style = getComputedStyle(canvas.getByTestId(variant));
      await expect(style.fontSize, variant).toBe(`${size}px`);
      await expect(style.fontWeight, variant).toBe(`${typographyPrimitives.fontWeight[s.weight]}`);
      await expect(parseFloat(style.lineHeight), variant).toBeCloseTo(
        size * typographyPrimitives.lineHeight[s.lineHeight],
        1,
      );
      await expect(parseFloat(style.letterSpacing), variant).toBeCloseTo(size * -0.02, 2);
      await expect(style.fontFamily.toLowerCase(), variant).toContain('pretendard');
    }
  },
};

export const Playground: Story = {};

export const DisplayLarge: Story = { args: { variant: 'display-lg' } };
export const HeadingMedium: Story = { args: { variant: 'heading-md' } };
export const LabelMedium: Story = { args: { variant: 'label-md' } };

export const SemanticElement: Story = {
  args: { variant: 'heading-lg', children: '기본 요소는 variant에 따라 정해집니다' },
  play: async ({ canvas }) => {
    // heading-lg는 기본 h2로 렌더 — as로 바꿀 수 있음
    await expect(canvas.getByRole('heading', { level: 2 })).toHaveTextContent(/variant/);
  },
};
