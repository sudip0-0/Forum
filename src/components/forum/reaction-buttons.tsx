"use client";

import { useState, useTransition } from "react";
import { toggleReaction } from "@/app/(public)/forum/[categorySlug]/[threadSlug]/actions";

const EMOJIS = [
  ["LIKE", "👍"],
  ["HELPFUL", "💡"],
  ["LAUGH", "😄"],
  ["INSIGHTFUL", "🧠"],
] as const;

export function ReactionButtons({
  targetId,
  targetType,
  initialCount,
}: {
  targetId: string;
  targetType: "post" | "thread";
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-1">
      {EMOJIS.map(([emoji, label]) => (
        <button
          key={emoji}
          type="button"
          disabled={isPending}
          className="rounded border px-2 py-1 text-xs hover:bg-accent"
          onClick={() =>
            startTransition(async () => {
              const result = await toggleReaction(targetType, targetId, emoji);
              if (result?.active === true) setCount((value) => value + 1);
              if (result?.active === false) setCount((value) => Math.max(0, value - 1));
            })
          }
        >
          {label}
        </button>
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{count} reactions</span>
    </div>
  );
}
