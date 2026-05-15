"use client";

import { useState, useTransition } from "react";
import type { AppRouterOutputs } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { moveThread, runThreadAction } from "../mod/actions";

type ThreadItem = AppRouterOutputs["moderation"]["listThreads"][number];
type ForumItem = AppRouterOutputs["forum"]["listForModeration"][number];

export function ThreadManagement({ threads, forums }: { threads: ThreadItem[]; forums: ForumItem[] }) {
  return (
    <div className="mt-8 space-y-4">
      <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_220px_180px_auto]">
        <input name="q" className="rounded-md border px-3 py-2 text-sm" placeholder="Search thread titles..." />
        <select name="forumId" className="rounded-md border px-3 py-2 text-sm">
          <option value="">All forums</option>
          {forums.map((forum) => <option key={forum.id} value={forum.id}>{forum.name}</option>)}
        </select>
        <select name="status" className="rounded-md border px-3 py-2 text-sm">
          <option value="all">All</option>
          <option value="locked">Locked</option>
          <option value="pinned">Pinned</option>
        </select>
        <Button type="submit">Filter</Button>
      </form>
      {threads.map((thread) => <ThreadRow key={thread.id} thread={thread} forums={forums} />)}
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
    <article className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">{thread.title}</h2>
          <div className="mt-1 text-xs text-muted-foreground">
            {thread.forum.name} · {thread.author.displayName ?? thread.author.username} · {new Date(thread.lastActivityAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex gap-2">
          {thread.isPinned && <span className="rounded bg-blue-100 px-2 py-1 text-xs">Pinned</span>}
          {thread.isLocked && <span className="rounded bg-amber-100 px-2 py-1 text-xs">Locked</span>}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
        <input value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-md border px-3 py-2 text-sm" placeholder="Reason required for moderator action" />
        <select value={forumId} onChange={(e) => setForumId(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
          {forums.map((forum) => <option key={forum.id} value={forum.id}>{forum.name}</option>)}
        </select>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => action(thread.isLocked ? "UNLOCK" : "LOCK")}>{thread.isLocked ? "Unlock" : "Lock"}</Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => action(thread.isPinned ? "UNPIN" : "PIN")}>{thread.isPinned ? "Unpin" : "Pin"}</Button>
          <Button size="sm" disabled={isPending || forumId === thread.forum.id || reason.trim().length < 3} onClick={() => startTransition(async () => {
            const result = await moveThread({ threadId: thread.id, forumId, reason });
            if (result.error) setError(result.error); else location.reload();
          })}>Move</Button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </article>
  );
}
