import type { Metadata } from "next";
import { LoginScreen } from "@/components/screens/LoginScreen";

export const metadata: Metadata = { title: "로그인 · 구로 맛길" };

export default function LoginPage() {
  return <LoginScreen />;
}
