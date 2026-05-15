"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { createThread } from "./actions";

export function NewThreadForm({
  categorySlug,
  forumId,
}: {
  categorySlug: string;
  forumId: string;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createThread(categorySlug, forumId, {
        title,
        content,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
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
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="Write your post content (Markdown supported)..."
        rows={8}
        disabled={isPending}
      />
      <input
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        placeholder="Tags, comma separated"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        disabled={isPending}
      />
      <Button onClick={handleSubmit} disabled={isPending || !title.trim() || !content.trim()}>
        Create Thread
      </Button>
    </div>
  );
}
