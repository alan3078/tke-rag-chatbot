import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/app-providers";
import { I18nProvider } from "@/providers/i18n-provider";
import { I18nHtml } from "@/providers/i18n-html";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "TKE RAG Chatbot — 清华大学软件学院",
  description: "AI-powered Q&A chatbot for Tsinghua School of Software website",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <I18nHtml className={cn("font-sans", geist.variable)}>
        <body className="antialiased">
          <Providers>{children}</Providers>
        </body>
      </I18nHtml>
    </I18nProvider>
  );
}
