"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

const values = ["광고 없는 이웃 추천", "주차 정보", "지도 바로가기"];

export function LoginScreen() {
  const [pending, setPending] = useState(false);

  // BFF Route Handler가 Google 인증 페이지로 리다이렉트한다
  const signInWithGoogle = () => {
    setPending(true);
    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    // 페이지가 아닌 Route Handler → 외부(Google) 리다이렉트라 전체 페이지 이동이 필요
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/api/auth/login?provider=google&next=${encodeURIComponent(next)}`);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-between px-(--spacing-16) py-(--spacing-32)">
      <div className="flex flex-1 flex-col justify-center gap-(--spacing-32) pb-(--spacing-32)">
        <Logo size="lg" as="h1" tagline="주말 맛집 드라이브" />

        <div className="flex flex-col gap-(--spacing-16)">
          <p className="display-md text-text-default">
            익숙한 동네를 벗어나
            <br />
            주말 한 끼
            <br />
            <span className="text-text-brand">드라이브 떠나요</span>
          </p>
          <p className="body-lg text-text-secondary">차로 30분 거리, 이웃이 직접 다녀온 맛집을 광고 없이 모았어요.</p>
        </div>

        <ul className="flex flex-wrap gap-(--spacing-8)">
          {values.map((v) => (
            <li key={v}>
              <Badge size="lg">{v}</Badge>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-center gap-(--spacing-12)">
        <Button variant="secondary" size="lg" fullWidth loading={pending} onClick={signInWithGoogle}>
          Google로 시작하기
        </Button>
        <p className="text-center label-md text-text-tertiary">시작하면 이용약관과 개인정보처리방침에 동의한 것으로 봐요</p>
      </div>
    </main>
  );
}
