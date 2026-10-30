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
- `src/lib/supabase` — 서버 전용 Supabase 클라이언트(`server.ts`) · 세션 갱신(`proxy.ts`)
- `src/app/api` — BFF Route Handler (`auth/login` · `auth/callback` · `auth/logout` · `profile`)
- `src/lib/auth.ts` — `getCurrentUser()` 로그인 사용자 + profile 조회 (Suspense 경계 안에서 호출)
- `src/proxy.ts` — 요청마다 Supabase 세션 쿠키 갱신 · 보호 경로 비로그인 시 `/login?next=` 리다이렉트

## Design SSOT: Storybook

- UI 작업 전 `src/stories/`의 스토리를 먼저 확인하고, 해당 컴포넌트를 재사용한다.
- 색상은 시맨틱 토큰(`text-text-*`, `bg-background-*`, `border-border-*`), 텍스트는 타이포 클래스(`heading-md` 등)만 사용. hex·임의 값 금지.
- 스토리에 없는 UI는 새로 만들지 말고 먼저 확인받는다. 추가·변경 시 스토리와 테스트도 함께 갱신한다.

## Supabase: Next.js BFF 경유

- 모든 Supabase API(DB·Auth·Storage 등)는 Next.js BFF(서버)를 통해서만 호출한다. 클라이언트 컴포넌트에서 Supabase를 직접 호출하지 않는다.
- BFF는 Route Handler(`src/app/api/**/route.ts`) 또는 Server Action/Server Component로 구현하고, 클라이언트는 이 엔드포인트만 호출한다.
- Supabase 클라이언트 생성은 서버 전용 모듈(`src/lib/supabase/`)에 두고 `import 'server-only'`로 클라이언트 번들 유입을 막는다.
- 키·URL은 `NEXT_PUBLIC_` 접두사 없이 서버 환경변수로만 관리한다. service role 키는 절대 클라이언트에 노출하지 않는다.
- 소셜 로그인(OAuth) 콜백·세션 처리도 BFF Route Handler에서 처리한다(쿠키 기반 세션).

## Responsive

- 브레이크포인트: Tailwind 기본(`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280)
- 레이아웃 폭은 `Container`(`src/components/layout`)만 사용: `wide` 최대 1280 · `narrow` 최대 640
- 좌우 여백: 16 → `md` 24 → `lg` 32 (spacing 토큰)
- 카드 목록은 `RestaurantGrid` 재사용: 1열 → `sm` 2열 → `lg` 3열 → `xl` 4열, gap 12 → `sm` 16
- 1280 초과 시 확장 금지, 중앙 정렬
