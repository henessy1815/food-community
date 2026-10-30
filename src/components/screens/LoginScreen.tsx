"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

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
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-background-overlay">
      {/* 실사 배경 + 위아래 그라데이션 (로고·버튼 가독성) */}
      <Image src="/images/dakgalbi.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-b from-background-overlay/70 via-background-overlay/10 via-45% to-background-overlay/90"
      />

      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-(--spacing-16) pt-[18dvh] pb-(--spacing-32)">
        <div className="relative flex justify-center">
          {/* 로고 뒤 은은한 방사형 어둠 — 붉은 배경 위 "맛길" 가독성 */}
          <div
            aria-hidden
            className="absolute top-[62%] left-1/2 -z-10 h-[360px] w-[460px] -translate-1/2 bg-radial from-background-overlay/85 via-background-overlay/50 via-35% to-transparent to-70%"
          />
          <Logo size="xl" tone="inverse" as="h1" />
        </div>

        <div className="mt-auto flex flex-col items-center gap-(--spacing-12)">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            loading={pending}
            onClick={signInWithGoogle}
            className="border-transparent"
          >
            Google로 계속하기
          </Button>
          <p className="label-md text-text-inverse/70">이용약관 | 개인정보처리방침</p>
        </div>
      </div>
    </main>
  );
}
