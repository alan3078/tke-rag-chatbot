import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border bg-card text-foreground",
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-0 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
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
