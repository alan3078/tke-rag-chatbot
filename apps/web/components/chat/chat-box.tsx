"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatMessageBubble } from "./chat-message";
import { CitationList } from "./citation-list";
import { postJson, getJson, ApiError, ERROR_I18N_MAP } from "@/services/api-client";
import { useI18n } from "@/providers/i18n-provider";
import { useInvalidateSessions } from "@/hooks/use-sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import type { ChatRequest, ChatResponse, DisplayMessage, SessionDetail } from "@/types";

const CHAT_ENDPOINT = "/api/chat";

interface ChatBoxProps {
  sessionId: string | null;
  onSessionCreated: (id: string) => void;
}

export function ChatBox({ sessionId, onSessionCreated }: ChatBoxProps) {
  const { t, locale } = useI18n();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const invalidateSessions = useInvalidateSessions();

  // Load messages when session changes
  useEffect(() => {
    setCurrentSessionId(sessionId);

    if (!sessionId) {
      setMessages([]);
      return;
    }

    getJson<SessionDetail>(`/api/sessions/${sessionId}`)
      .then((detail) => {
        setMessages(
          detail.messages.map((m) => ({
            role: m.role,
            content: m.content,
            citations: m.citations ?? undefined,
          })),
        );
      })
      .catch(() => {
        setMessages([]);
      });
  }, [sessionId]);

  const chatMutation = useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: (request) => postJson<ChatResponse, ChatRequest>(CHAT_ENDPOINT, request),
  });

  const isSubmitting = chatMutation.isPending;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isSubmitting) return;

    const userMessage: DisplayMessage = { role: "user", content: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    chatMutation.mutate(
      {
        message: trimmedInput,
        sessionId: currentSessionId ?? undefined,
        locale,
      },
      {
        onSuccess: (data) => {
          // If this created a new session, propagate the ID
          if (!currentSessionId) {
            setCurrentSessionId(data.sessionId);
            onSessionCreated(data.sessionId);
          }

          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.answer, citations: data.citations },
          ]);

          // Refresh sidebar session list
          invalidateSessions();
        },
        onError: (error) => {
          const msg =
            error instanceof ApiError && error.code
              ? t((ERROR_I18N_MAP[error.code] ?? "error.unknown") as Parameters<typeof t>[0])
              : t("chat.error");
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: msg },
          ]);
        },
      },
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50 to-[var(--page-bg)] p-5">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mx-auto mt-20 max-w-2xl rounded-2xl border bg-card px-8 py-10 text-center shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                {t("tkeTag")}
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight">
                {t("chat.welcome")}
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {t("chat.welcomeDetail")}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground/60">
                {t("chat.welcomeAnswerNote")}
              </p>
            </motion.div>
          )}
          {messages.map((message, index) => (
            <motion.div
              key={`${currentSessionId ?? "new"}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <ChatMessageBubble message={message} />
              {message.citations && message.citations.length > 0 && (
                <CitationList citations={message.citations} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 pl-1 text-sm text-muted-foreground"
          >
            <div className="rounded-full bg-muted px-3 py-1.5">
              <span className="inline-flex gap-1">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                />
              </span>
              <span className="ml-2">{t("chat.thinking")}</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t bg-card px-5 py-4">
        <div className="mx-auto flex w-full max-w-5xl gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.placeholder")}
            className="flex-1 rounded-xl"
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={isSubmitting || !input.trim()} size="lg">
            <Send className="mr-2 h-4 w-4" />
            {t("chat.send")}
          </Button>
        </div>
      </form>
    </div>
  );
}
