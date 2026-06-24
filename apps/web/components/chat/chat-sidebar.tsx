"use client";

import { useSessions, useDeleteSession } from "@/hooks/use-sessions";
import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({ activeSessionId, onSelectSession, onNewChat }: ChatSidebarProps) {
  const { t } = useI18n();
  const { data: sessions, isLoading } = useSessions();
  const deleteMutation = useDeleteSession();

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm(t("sidebar.deleteConfirm"))) return;
    deleteMutation.mutate(id);
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      {/* New chat button */}
      <div className="border-b p-3">
        <Button onClick={onNewChat} className="w-full justify-start gap-2" variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          {t("sidebar.newChat")}
        </Button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {t("sidebar.history")}
        </p>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {!isLoading && (!sessions || sessions.length === 0) && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            {t("sidebar.noSessions")}
          </p>
        )}

        <ul className="space-y-0.5 px-2 pb-2">
          {sessions?.map((session) => (
            <li key={session.id}>
              <button
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  activeSessionId === session.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
                <span className="flex-1 truncate">
                  {session.title || "Untitled"}
                </span>
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
