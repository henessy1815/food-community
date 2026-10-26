@AGENTS.md

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Storybook 10 (`@storybook/nextjs-vite`) · Vitest

## Commands

- `npm run dev` · `npm run build` · `npm run lint` · `npx tsc --noEmit`
- `npm run storybook` (localhost:6006)
- `npx vitest --project storybook run` — 스토리 테스트

## Structure

- `src/styles/tokens.css` · `typography.css` — 디자인 토큰 (design.pen 1:1)
- `src/components/foundations` — Text, Icon
- `src/components/ui` — UI 컴포넌트
- `src/stories` — 스토리

## Design SSOT: Storybook

- UI 작업 전 `src/stories/`의 스토리를 먼저 확인하고, 해당 컴포넌트를 재사용한다.
- 색상은 시맨틱 토큰(`text-text-*`, `bg-background-*`, `border-border-*`), 텍스트는 타이포 클래스(`heading-md` 등)만 사용. hex·임의 값 금지.
- 스토리에 없는 UI는 새로 만들지 말고 먼저 확인받는다. 추가·변경 시 스토리와 테스트도 함께 갱신한다.

## Responsive

- 브레이크포인트: Tailwind 기본(`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280)
- 레이아웃 폭은 `Container`(`src/components/layout`)만 사용: `wide` 최대 1280 · `narrow` 최대 640
- 좌우 여백: 16 → `md` 24 → `lg` 32 (spacing 토큰)
- 카드 목록은 `RestaurantGrid` 재사용: 1열 → `sm` 2열 → `lg` 3열 → `xl` 4열, gap 12 → `sm` 16
- 1280 초과 시 확장 금지, 중앙 정렬
