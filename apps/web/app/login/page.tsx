import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const user = await verifySession();

  if (user) {
    redirect("/chat");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-6 py-12 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-slate-200 bg-[#0F172A] px-8 py-10 text-slate-100 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C9A227]">
              TKE Knowledge Console
            </p>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              清华大学软件学院
            </h1>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">
              面向评测与检索验证的知识问答入口。登录后可直接查询学院公开网站内容，并查看答案来源。
            </p>
            <div className="mt-10 grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="font-medium text-slate-100">Bilingual retrieval</p>
                <p className="mt-1 text-slate-400">中文与英文问题均可直接提问</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="font-medium text-slate-100">Source-backed answers</p>
                <p className="mt-1 text-slate-400">每次回答都会附带文章来源与日期</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-10 lg:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Secure Sign In
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
              Access the chat interface
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              使用评测账号登录后，即可进入学院知识问答界面。
            </p>
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
