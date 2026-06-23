"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChatMessageBubble } from "./chat-message";
import { CitationList } from "./citation-list";
import { postJson } from "@/lib/api-client";
import { MessageRole } from "@/lib/constants";
import type { ChatRequest, ChatResponse, DisplayMessage } from "@/types";

const CHAT_ENDPOINT = "/api/chat";
const CHAT_PLACEHOLDER = "输入您的问题...";
const CHAT_PENDING_LABEL = "Thinking...";
const CHAT_ERROR_MESSAGE = "抱歉，发生了错误，请稍后再试。";
const SEND_BUTTON_LABEL = "Send";

export function ChatBox() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

    const userMessage: DisplayMessage = { role: MessageRole.User, content: trimmedInput };
    const history = messages.map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    chatMutation.mutate(
      {
        message: trimmedInput,
        history,
      },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            {
              role: MessageRole.Assistant,
              content: data.answer,
              citations: data.citations,
            } satisfies DisplayMessage,
          ]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            {
              role: MessageRole.Assistant,
              content: CHAT_ERROR_MESSAGE,
            } satisfies DisplayMessage,
          ]);
        },
      },
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-5">
        {messages.length === 0 && (
          <div className="mx-auto mt-20 max-w-2xl rounded-[24px] border border-slate-200 bg-white/90 px-8 py-10 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7A1F2B]">
              TKE Knowledge Console
            </p>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
              Welcome to TKE RAG Chatbot
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Ask any question about 清华大学软件学院
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              Answers are grounded in indexed school website sources
            </p>
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index}>
            <ChatMessageBubble message={message} />
            {message.citations && message.citations.length > 0 && (
              <CitationList citations={message.citations} />
            )}
          </div>
        ))}
        {isSubmitting && (
          <div className="flex items-center gap-2 pl-1 text-sm text-slate-400">
            <div className="animate-pulse rounded-full bg-slate-200 px-3 py-1.5">
              {CHAT_PENDING_LABEL}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex w-full max-w-5xl gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={CHAT_PLACEHOLDER}
            className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#7A1F2B]/25"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !input.trim()}
            className="rounded-2xl bg-[#7A1F2B] px-6 py-3 text-sm font-semibold tracking-[0.08em] text-white transition hover:bg-[#651a24] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {SEND_BUTTON_LABEL}
          </button>
        </div>
      </form>
    </div>
  );
}
