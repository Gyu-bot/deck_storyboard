import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deck Storyboard",
  description: "AI slide storyboard builder for consulting decks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
