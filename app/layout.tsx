import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./iphone.css";

export const metadata: Metadata = {
  title: "坐标 · 找到自己的生活哲学",
  description: "认识不同的哲学基座，带着生活中的困惑展开对话，慢慢形成自己的判断依据。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  applicationName: "坐标",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "坐标",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#171a1d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
