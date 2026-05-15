"use client";

import { Clock } from "lucide-react";

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    DISMISS: "Dismissed report",
    SOFT_DELETE_POST: "Soft-deleted post",
    SOFT_DELETE_THREAD: "Soft-deleted thread",
    RESTORE_POST: "Restored post",
    RESTORE_THREAD: "Restored thread",
    LOCK_THREAD: "Locked thread",
    UNLOCK_THREAD: "Unlocked thread",
    PIN_THREAD: "Pinned thread",
    UNPIN_THREAD: "Unpinned thread",
    ROLE_CHANGE: "Changed role",
    MOVE_THREAD: "Moved thread",
    SUSPEND_USER: "Suspended user",
    UNSUSPEND_USER: "Unsuspended user",
  };
  return labels[action] ?? action;
}

function actionBadge(action: string): string {
  if (action.startsWith("SOFT_DELETE") || action === "SUSPEND_USER") return "badge-red";
  if (action.startsWith("RESTORE") || action === "UNSUSPEND_USER") return "badge-green";
  if (action.startsWith("LOCK") || action.startsWith("PIN")) return "badge-amber";
  if (action.startsWith("UNLOCK") || action.startsWith("UNPIN")) return "badge-blue";
  if (action === "DISMISS") return "badge-orange";
  return "badge-blue";
}

export interface HistoryLog {
  id: string;
  moderator: { username: string; displayName: string | null };
  targetUser: { username: string; displayName: string | null } | null;
  post: { id: string; content: string } | null;
  thread: { id: string; title: string; slug: string } | null;
  action: string;
  reason: string | null;
  createdAt: string;
}

export function ModerationHistoryList({ logs }: { logs: HistoryLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="empty-state mt-6">
        <div className="empty-state-icon">
          <Clock className="h-10 w-10" />
        </div>
        <p className="empty-state-title">No history yet</p>
        <p className="empty-state-text">No moderation actions have been recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-sm border-2 border-border shadow-[2px_2px_0px_var(--border)]">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b-2 border-border bg-muted/50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <th className="px-4 py-3">Moderator</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Target</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t border-border text-sm hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-medium">
                {log.moderator.displayName ?? log.moderator.username}
              </td>
              <td className="px-4 py-3">
                <span className={actionBadge(log.action)}>
                  {actionLabel(log.action)}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                {log.targetUser?.username
                  ? `@${log.targetUser.username}`
                  : log.thread?.title
                    ? `Thread: ${log.thread.title}`
                    : log.post?.content
                      ? `Post: ${log.post.content.slice(0, 60)}...`
                      : "-"}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                {log.reason ?? "-"}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                {new Date(log.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
