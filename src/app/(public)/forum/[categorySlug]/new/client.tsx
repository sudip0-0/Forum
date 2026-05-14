"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createThread } from "./actions";

export function NewThreadForm({
  categorySlug,
  categoryId,
}: {
  categorySlug: string;
  categoryId: string;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createThread(categorySlug, categoryId, { title, content });
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <input
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        placeholder="Thread title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isPending}
      />
      <textarea
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        placeholder="Write your post content..."
        rows={8}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isPending}
      />
      <Button onClick={handleSubmit} disabled={isPending || !title.trim() || !content.trim()}>
        Create Thread
      </Button>
    </div>
  );
}
