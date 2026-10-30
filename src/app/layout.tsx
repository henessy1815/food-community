import type { Metadata } from "next";
import { pretendard } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "구로 맛길",
  description: "구로 이웃이 차 타고 직접 다녀온 주말 맛집",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
