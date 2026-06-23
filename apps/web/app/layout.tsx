import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TKE RAG Chatbot — 清华大学软件学院",
  description: "AI-powered Q&A chatbot for Tsinghua School of Software website",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
