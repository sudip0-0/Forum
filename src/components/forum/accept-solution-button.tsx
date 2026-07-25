"use client";

import { useState } from "react";
import { acceptSolution } from "@/app/(public)/forum/[categorySlug]/[threadSlug]/actions";

export function AcceptSolutionButton({
  threadId,
  postId,
  categorySlug,
  threadSlug,
  isAccepted,
}: {
  threadId: string;
  postId: string;
  categorySlug: string;
  threadSlug: string;
  isAccepted?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (isAccepted) {
    return (
      <span className="rounded-md border border-border bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
        Solution
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="text-xs font-semibold text-primary hover:underline"
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const result = await acceptSolution(categorySlug, threadSlug, {
              threadId,
              postId,
            });
            if (result.error) setError(result.error);
            else window.location.reload();
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Saving…" : "Mark as solution"}
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
