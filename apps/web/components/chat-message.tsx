import ReactMarkdown from "react-markdown";
import { MessageRole } from "@/lib/constants";
import type { ChatMessage } from "@/types";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageProps) {
  const isUser = message.role === MessageRole.User;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${
          isUser
            ? "bg-[#7A1F2B] text-white"
            : "border border-slate-200 bg-white text-slate-900"
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-0 prose-strong:text-slate-950 prose-a:text-[#7A1F2B] prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown
              components={{
                a: ({ node: _node, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
