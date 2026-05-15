"use client";

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

function actionColor(action: string): string {
  if (action.startsWith("SOFT_DELETE") || action === "SUSPEND_USER") return "text-red-600 dark:text-red-400";
  if (action.startsWith("RESTORE") || action === "UNSUSPEND_USER") return "text-green-600 dark:text-green-400";
  if (action.startsWith("LOCK") || action.startsWith("PIN")) return "text-amber-600 dark:text-amber-400";
  if (action.startsWith("UNLOCK") || action.startsWith("UNPIN")) return "text-blue-600 dark:text-blue-400";
  if (action === "DISMISS") return "text-neutral-500";
  return "text-neutral-700 dark:text-neutral-300";
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
      <p className="mt-8 text-sm text-muted-foreground">
        No moderation actions recorded yet.
      </p>
    );
  }

  return (
    <div className="mt-8 rounded-lg border overflow-x-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b text-left text-xs font-medium text-muted-foreground">
            <th className="px-4 py-2">Moderator</th>
            <th className="px-4 py-2">Action</th>
            <th className="px-4 py-2">Target</th>
            <th className="px-4 py-2">Reason</th>
            <th className="px-4 py-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-t text-sm">
              <td className="px-4 py-3">
                <span className="font-medium">
                  {log.moderator.displayName ?? log.moderator.username}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`font-medium ${actionColor(log.action)}`}>
                  {actionLabel(log.action)}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {log.targetUser?.username
                  ? `@${log.targetUser.username}`
                  : log.thread?.title
                    ? `Thread: ${log.thread.title}`
                    : log.post?.content
                      ? `Post: ${log.post.content.slice(0, 60)}...`
                      : "-"}
              </td>
              <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                {log.reason ?? "-"}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
