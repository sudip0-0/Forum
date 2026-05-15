"use client";

import { useMemo, useState, useTransition } from "react";
import { toggleReaction } from "@/app/(public)/forum/[categorySlug]/[threadSlug]/actions";

const EMOJIS = [
  ["LIKE", "👍"],
  ["HELPFUL", "💡"],
  ["LAUGH", "😄"],
  ["INSIGHTFUL", "🧠"],
] as const;

type Emoji = (typeof EMOJIS)[number][0];

function reactionLabel(reaction: string | null) {
  if (reaction === "LIKE") return "LIKED";
  return reaction ?? "Like";
}

export function ReactionButtons({
  targetId,
  targetType,
  reactions,
  currentUserId,
}: {
  targetId: string;
  targetType: "post" | "thread";
  reactions: { userId: string; emoji: string }[];
  currentUserId?: string;
}) {
  const [items, setItems] = useState(reactions);
  const [isPending, startTransition] = useTransition();
  const activeReaction = useMemo(
    () => items.find((reaction) => reaction.userId === currentUserId)?.emoji ?? null,
    [currentUserId, items],
  );

  function react(emoji: Emoji) {
    if (!currentUserId) return;
    startTransition(async () => {
      const result = await toggleReaction(targetType, targetId, emoji);
      if (!result) return;
      setItems((previous) => {
        const withoutMine = previous.filter((reaction) => reaction.userId !== currentUserId);
        return result.active && result.emoji
          ? [...withoutMine, { userId: currentUserId, emoji: result.emoji }]
          : withoutMine;
      });
    });
  }

  return (
    <div className="group relative inline-flex items-center">
      <button
        type="button"
        disabled={isPending || !currentUserId}
        onClick={() => react("LIKE")}
        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors ${
          activeReaction ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span>{EMOJIS.find(([emoji]) => emoji === (activeReaction ?? "LIKE"))?.[1]}</span>
        <span>{reactionLabel(activeReaction)}</span>
      </button>
      <div className="invisible absolute bottom-full left-0 z-10 pb-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="flex gap-1 rounded-full border bg-background p-1 shadow-lg">
          {EMOJIS.map(([emoji, label]) => (
            <button
              key={emoji}
              type="button"
              disabled={isPending || !currentUserId}
              onClick={() => react(emoji)}
              className={`rounded-full px-2 py-1 text-base hover:bg-accent ${activeReaction === emoji ? "bg-accent" : ""}`}
              aria-label={emoji.toLowerCase()}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {items.length > 0 && <span className="ml-1 text-xs text-muted-foreground">{items.length}</span>}
    </div>
  );
}
