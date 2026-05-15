"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { moveThread, runThreadAction } from "@/app/admin/mod/actions";
import { Lock, Unlock, Pin, PinOff, Move, ShieldAlert } from "lucide-react";

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
      if (result.error) setError(result.error);
      else location.reload();
    });
  };
  return (
    <details className="group mt-6 overflow-hidden rounded-xl border-2 border-border bg-card shadow-brutal-sm">
      <summary className="flex cursor-pointer items-center gap-2 border-b border-border/50 bg-muted/20 px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted/30">
        <ShieldAlert className="h-4 w-4 text-primary" />
        Moderator controls
      </summary>
      <div className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            className="input rounded-lg border-2 border-border bg-background px-3 py-2 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Reason required"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <select
            className="input rounded-lg border-2 border-border bg-background px-3 py-2 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={forumId}
            onChange={(e) => setForumId(e.target.value)}
          >
            {forums.map((forum) => (
              <option key={forum.id} value={forum.id}>
                {forum.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => act(isLocked ? "UNLOCK" : "LOCK")}
          >
            {isLocked ? (
              <><Unlock className="h-3.5 w-3.5" /> Unlock</>
            ) : (
              <><Lock className="h-3.5 w-3.5" /> Lock</>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => act(isPinned ? "UNPIN" : "PIN")}
          >
            {isPinned ? (
              <><PinOff className="h-3.5 w-3.5" /> Unpin</>
            ) : (
              <><Pin className="h-3.5 w-3.5" /> Pin</>
            )}
          </Button>
          <Button
            size="sm"
            disabled={isPending || forumId === currentForumId || reason.trim().length < 3}
            onClick={() =>
              startTransition(async () => {
                const result = await moveThread({ threadId, forumId, reason });
                if (result.error) setError(result.error);
                else location.reload();
              })
            }
          >
            <Move className="h-3.5 w-3.5" />
            Move thread
          </Button>
        </div>
        {error && (
          <p className="text-xs font-medium text-destructive">{error}</p>
        )}
      </div>
    </details>
  );
}
