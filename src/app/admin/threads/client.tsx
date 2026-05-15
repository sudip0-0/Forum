"use client";

import { useState, useTransition } from "react";
import type { AppRouterOutputs } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { moveThread, runThreadAction } from "../mod/actions";
import { Search, Lock, Unlock, Pin, PinOff, ArrowRight } from "lucide-react";

type ThreadItem = AppRouterOutputs["moderation"]["listThreads"][number];
type ForumItem = AppRouterOutputs["forum"]["listForModeration"][number];

export function ThreadManagement({ threads, forums }: { threads: ThreadItem[]; forums: ForumItem[] }) {
  return (
    <div className="mt-6 space-y-4">
      {/* Search & Filter */}
      <form className="filter-panel">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                className="w-full rounded-sm border-2 border-border bg-background py-2 pl-9 pr-3 text-sm shadow-[1px_1px_0px_var(--border)]"
                placeholder="Search thread titles..."
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Forum</label>
            <select name="forumId" className="rounded-sm border-2 border-border bg-background px-3 py-2 text-sm shadow-[1px_1px_0px_var(--border)]">
              <option value="">All forums</option>
              {forums.map((forum) => <option key={forum.id} value={forum.id}>{forum.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <select name="status" className="rounded-sm border-2 border-border bg-background px-3 py-2 text-sm shadow-[1px_1px_0px_var(--border)]">
              <option value="all">All</option>
              <option value="locked">Locked</option>
              <option value="pinned">Pinned</option>
            </select>
          </div>
          <Button type="submit">
            <Search className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </form>

      {/* Threads */}
      <div className="space-y-3">
        {threads.map((thread) => (
          <ThreadRow key={thread.id} thread={thread} forums={forums} />
        ))}
        {threads.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-title">No threads found</p>
            <p className="empty-state-text">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadRow({ thread, forums }: { thread: ThreadItem; forums: ForumItem[] }) {
  const [reason, setReason] = useState("");
  const [forumId, setForumId] = useState(thread.forum.id);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function action(action: "LOCK" | "UNLOCK" | "PIN" | "UNPIN") {
    if (reason.trim().length < 3) return setError("Reason is required.");
    startTransition(async () => {
      const result = await runThreadAction({ threadId: thread.id, action, reason });
      if (result.error) setError(result.error); else location.reload();
    });
  }

  return (
    <div className="card-elevated overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {thread.isPinned && <span className="badge-lime text-[10px] py-0">Pinned</span>}
            {thread.isLocked && <span className="badge-amber text-[10px] py-0">Locked</span>}
          </div>
          <div className="text-sm font-semibold">{thread.title}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {thread.forum.name} · {thread.author.displayName ?? thread.author.username} · {new Date(thread.lastActivityAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="border-t-2 border-border bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm shadow-[1px_1px_0px_var(--border)]"
              placeholder="Reason required for moderator action..."
            />
          </div>
          <div>
            <select
              value={forumId}
              onChange={(e) => setForumId(e.target.value)}
              className="rounded-sm border-2 border-border bg-background px-3 py-2 text-sm shadow-[1px_1px_0px_var(--border)]"
            >
              {forums.map((forum) => <option key={forum.id} value={forum.id}>{forum.name}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => action(thread.isLocked ? "UNLOCK" : "LOCK")}
              className="gap-1"
            >
              {thread.isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {thread.isLocked ? "Unlock" : "Lock"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => action(thread.isPinned ? "UNPIN" : "PIN")}
              className="gap-1"
            >
              {thread.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              {thread.isPinned ? "Unpin" : "Pin"}
            </Button>
            <Button
              size="sm"
              disabled={isPending || forumId === thread.forum.id || reason.trim().length < 3}
              onClick={() => startTransition(async () => {
                const result = await moveThread({ threadId: thread.id, forumId, reason });
                if (result.error) setError(result.error); else location.reload();
              })}
              className="gap-1"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Move
            </Button>
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-destructive font-medium">{error}</p>}
      </div>
    </div>
  );
}
