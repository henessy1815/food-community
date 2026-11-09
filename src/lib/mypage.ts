// 서버(page.tsx)·클라이언트(MyPageScreen) 양쪽에서 쓰는 탭 정의 — "use client" 모듈에 두면 서버에선 클라이언트 참조가 되어 값을 쓸 수 없다
export type MyPageTab = "posts" | "payments" | "cancels";

export const MY_PAGE_TABS: { value: MyPageTab; label: string }[] = [
  { value: "posts", label: "내가 쓴 글" },
  { value: "payments", label: "결제 내역" },
  { value: "cancels", label: "취소 내역" },
];
