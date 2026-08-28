import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "보배드림 숏폼 제작",
  description: "중고차 사진을 세로형 AI 숏폼 영상으로 자동 제작합니다.",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
