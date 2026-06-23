import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "TKE RAG Chatbot — 清华大学软件学院",
  description: "AI-powered Q&A chatbot for Tsinghua School of Software website",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
