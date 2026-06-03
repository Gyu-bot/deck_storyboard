import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deck Storyboard",
  description: "컨설턴트용 AI 슬라이드 스토리보드 워크스페이스.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
