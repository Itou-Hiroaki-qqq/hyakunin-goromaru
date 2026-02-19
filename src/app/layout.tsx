import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "百人一首 -ゴロでマル覚え-",
  description: "百人一首を語呂合わせで楽しく覚えるWebアプリ",
  robots: "noindex, nofollow",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
