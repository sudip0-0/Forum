"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { moveThread, runThreadAction } from "@/app/admin/mod/actions";

export function ThreadModerationControls({
  threadId,
  isLocked,
  isPinned,
  currentForumId,
  forums,
}: {
  threadId: string;
  isLocked: boolean;
  isPinned: boolean;
  currentForumId: string;
  forums: { id: string; name: string }[];
}) {
  const [reason, setReason] = useState("");
  const [forumId, setForumId] = useState(currentForumId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const act = (action: "LOCK" | "UNLOCK" | "PIN" | "UNPIN") => {
    if (reason.trim().length < 3) return setError("Reason is required.");
    startTransition(async () => {
      const result = await runThreadAction({ threadId, action, reason });
      if (result.error) setError(result.error); else location.reload();
    });
  };
  return (
    <details className="mt-4 rounded-lg border p-4">
      <summary className="cursor-pointer text-sm font-medium">Moderator controls</summary>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <input className="rounded-md border px-3 py-2 text-sm" placeholder="Reason required" value={reason} onChange={(e) => setReason(e.target.value)} />
        <select className="rounded-md border px-3 py-2 text-sm" value={forumId} onChange={(e) => setForumId(e.target.value)}>
          {forums.map((forum) => <option key={forum.id} value={forum.id}>{forum.name}</option>)}
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => act(isLocked ? "UNLOCK" : "LOCK")}>{isLocked ? "Unlock" : "Lock"}</Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => act(isPinned ? "UNPIN" : "PIN")}>{isPinned ? "Unpin" : "Pin"}</Button>
        <Button size="sm" disabled={isPending || forumId === currentForumId || reason.trim().length < 3} onClick={() => startTransition(async () => {
          const result = await moveThread({ threadId, forumId, reason });
          if (result.error) setError(result.error); else location.reload();
        })}>Move thread</Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </details>
  );
}
