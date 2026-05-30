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
  if (reaction === "LIKE") return "Liked";
  if (reaction === "HELPFUL") return "Helpful";
  if (reaction === "LAUGH") return "Haha";
  if (reaction === "INSIGHTFUL") return "Insightful";
  return "React";
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
      <div className="inline-flex items-center gap-0.5 rounded-sm border-2 border-border bg-background shadow-[1px_1px_0px_var(--border)]">
        <button
          type="button"
          disabled={isPending || !currentUserId}
          onClick={() => react("LIKE")}
          className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold transition-all hover:bg-accent disabled:opacity-40 ${
            activeReaction ? "text-primary bg-primary/10" : "text-muted-foreground"
          }`}
          title={activeReaction ? `Remove ${reactionLabel(activeReaction)}` : "React"}
        >
          <span>{activeReaction ? EMOJIS.find(([e]) => e === activeReaction)?.[1] : "👍"}</span>
          <span>{reactionLabel(activeReaction)}</span>
        </button>

        {/* Popover with all reactions */}
        <div className="hidden group-hover:flex group-focus-within:flex absolute bottom-full left-0 z-10 pb-2">
          <div className="flex gap-0.5 rounded-sm border-2 border-border bg-card p-1 shadow-[2px_2px_0px_var(--border)]">
            {EMOJIS.map(([emoji, label]) => (
              <button
                key={emoji}
                type="button"
                disabled={isPending || !currentUserId}
                onClick={() => react(emoji)}
                className={`rounded-sm px-2 py-1 text-base transition-all hover:bg-accent disabled:opacity-40 ${
                  activeReaction === emoji ? "bg-accent ring-2 ring-primary" : ""
                }`}
                aria-label={emoji.toLowerCase()}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {items.length > 0 && (
        <span className="ml-1.5 font-mono text-xs text-muted-foreground">
          {items.length}
          <span className="sr-only">
            {" "}
            {items.length === 1 ? "reaction" : "reactions"}
          </span>
        </span>
      )}
    </div>
  );
}
