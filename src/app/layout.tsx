import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Betting System",
  description: "Basic betting system built with Next.js and Prisma",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
