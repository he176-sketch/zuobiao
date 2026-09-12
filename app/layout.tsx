import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "坐标 · 找到自己的生活哲学",
  description: "认识不同的哲学基座，带着生活中的困惑展开对话，慢慢形成自己的判断依据。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
