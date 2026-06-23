import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { ChatBox } from "@/components/chat-box";

export default async function ChatPage() {
  const user = await verifySession();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex h-screen flex-col bg-[var(--page-bg)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              TKE Knowledge Console
            </p>
            <h1 className="mt-2 text-lg font-semibold tracking-tight">
              清华大学软件学院 — 知识问答
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              基于 RAG 的智能问答系统，回答均附带来源引用
            </p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              退出登录
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-hidden">
        <ChatBox />
      </div>
    </main>
  );
}
