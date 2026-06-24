"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ChatBox } from "@/components/chat/chat-box";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { LanguageSwitcher } from "@/components/auth/language-switcher";
import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function ChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.invalidateQueries({ queryKey: ["session"] });
    router.push("/login");
  }

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const handleSessionCreated = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  return (
    <AuthGuard>
      <main className="flex h-screen flex-col bg-background text-foreground">
        <header className="border-b bg-card/95 px-6 py-3 backdrop-blur">
          <div className="flex w-full items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                {t("tkeTag")}
              </p>
              <h1 className="mt-1 text-base font-semibold tracking-tight">
                {t("app.title")} — {t("app.subtitle")}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                {t("chat.logout")}
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <ChatSidebar
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
          />
          <ChatBox
            key={activeSessionId ?? "new"}
            sessionId={activeSessionId}
            onSessionCreated={handleSessionCreated}
          />
        </div>
      </main>
    </AuthGuard>
  );
}
