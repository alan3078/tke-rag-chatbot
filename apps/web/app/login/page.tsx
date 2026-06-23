import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const user = await verifySession();

  if (user) {
    redirect("/chat");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-2">清华大学软件学院</h1>
        <p className="text-gray-500 text-center mb-6">RAG Chatbot — 知识问答系统</p>
        <LoginForm />
      </div>
    </main>
  );
}
