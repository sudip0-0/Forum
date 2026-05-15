"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { createThread } from "./actions";
import { MessageSquare, Tags } from "lucide-react";

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
    <div className="space-y-5">
      {error && (
        <div className="rounded-sm border-2 border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="thread-title" className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Thread Title
        </label>
        <input
          id="thread-title"
          aria-label="Thread title"
          data-testid="thread-title"
          className="w-full rounded-md border-2 border-border bg-card px-4 py-3 text-sm shadow-[2px_2px_0px_var(--border)] outline-none focus:shadow-[1px_1px_0px_var(--border)] focus:translate-x-[1px] focus:translate-y-[1px] transition-all"
          placeholder="What&apos;s your discussion about?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Content */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Content
        </label>
        <MarkdownEditor
          value={content}
          onChange={setContent}
          placeholder="Write your post content (Markdown supported)..."
          rows={8}
          disabled={isPending}
          textareaName="content"
          textareaTestId="thread-content"
        />
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="thread-tags" className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Tags className="h-3 w-3" />
            Tags
          </span>
        </label>
        <input
          id="thread-tags"
          aria-label="Thread tags"
          className="w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm shadow-[1px_1px_0px_var(--border)] outline-none focus:shadow-[1px_1px_0px_var(--border)] focus:translate-x-[1px] focus:translate-y-[1px] transition-all"
          placeholder="Tags, comma separated (e.g. help, discussion, idea)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-muted-foreground">
          Markdown formatting supported
        </p>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !title.trim() || !content.trim()}
          size="lg"
        >
          <MessageSquare className="h-4 w-4" />
          {isPending ? "Creating..." : "Create Thread"}
        </Button>
      </div>
    </div>
  );
}
