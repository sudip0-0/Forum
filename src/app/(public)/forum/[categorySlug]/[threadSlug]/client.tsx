"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { createReply } from "./actions";

export function ReplyForm({
  threadId,
  categorySlug,
  threadSlug,
  parentId,
}: {
  threadId: string;
  categorySlug: string;
  threadSlug: string;
  parentId?: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createReply(categorySlug, threadSlug, {
        threadId,
        parentId,
        content,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setContent("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="Write a reply (Markdown supported)..."
        rows={4}
        disabled={isPending}
      />
      <Button onClick={handleSubmit} disabled={isPending || !content.trim()}>
        Reply
      </Button>
    </div>
  );
}
