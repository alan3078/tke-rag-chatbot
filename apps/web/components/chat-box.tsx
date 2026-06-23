"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessageBubble } from "./chat-message";
import { CitationList } from "./citation-list";

interface Citation {
  title: string;
  url: string;
  section: string | null;
  date: string | null;
}

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export function ChatBox() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: DisplayMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();
      const assistantMessage: DisplayMessage = {
        role: "assistant",
        content: data.answer,
        citations: data.citations,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "抱歉，发生了错误，请稍后再试。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-lg">Welcome to TKE RAG Chatbot</p>
            <p className="text-sm mt-2">
              Ask any question about 清华大学软件学院
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            <ChatMessageBubble message={msg} />
            {msg.citations && msg.citations.length > 0 && (
              <CitationList citations={msg.citations} />
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="animate-pulse">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t p-4 flex gap-2 bg-white"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入您的问题..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
