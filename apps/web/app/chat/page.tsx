import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { ChatBox } from "@/components/chat-box";

export default async function ChatPage() {
  const user = await verifySession();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <div>
          <h1 className="text-lg font-semibold">清华大学软件学院 — 知识问答</h1>
          <p className="text-sm text-gray-500">基于 RAG 的智能问答系统</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border rounded"
          >
            退出登录
          </button>
        </form>
      </header>
      <ChatBox />
    </main>
  );
}
