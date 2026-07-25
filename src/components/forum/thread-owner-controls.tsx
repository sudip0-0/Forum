"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { deleteOwnThread, updateOwnThread } from "@/app/(public)/forum/[categorySlug]/[threadSlug]/actions";
import { Pencil, Trash2 } from "lucide-react";

export function ThreadOwnerControls({
  threadId,
  threadTitle,
  threadContent,
  replyCount,
  categorySlug,
  threadSlug,
}: {
  threadId: string;
  threadTitle: string;
  threadContent: string;
  replyCount: number;
  categorySlug: string;
  threadSlug: string;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(threadTitle);
  const [content, setContent] = useState(threadContent);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function cancel() {
    setTitle(threadTitle);
    setContent(threadContent);
    setError(null);
    setIsEditing(false);
  }

  async function save() {
    setError(null);
    setIsPending(true);
    try {
      const result = await updateOwnThread(categorySlug, threadSlug, { threadId, title, content });
      if (result.error) setError(result.error);
      else {
        setIsEditing(false);
        router.refresh();
      }
    } finally {
      setIsPending(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this thread? This cannot be undone by you.")) return;
    setError(null);
    setIsPending(true);
    try {
      const result = await deleteOwnThread(categorySlug, threadSlug, { threadId });
      if (result.error) setError(result.error);
      else {
        router.replace(`/forum/${categorySlug}`);
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="mb-6 rounded-md border-2 border-border bg-card p-4 shadow-[2px_2px_0px_var(--border)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Your thread</p>
        <div className="flex flex-wrap gap-2">
          {!isEditing && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(true)} disabled={isPending}>
              <Pencil className="mr-1 h-3 w-3" />
              Edit thread
            </Button>
          )}
          {replyCount === 0 ? (
            <Button type="button" variant="destructive" size="sm" onClick={remove} disabled={isPending}>
              <Trash2 className="mr-1 h-3 w-3" />
              {isPending ? "Deleting..." : "Delete thread"}
            </Button>
          ) : (
            <p className="self-center text-xs text-muted-foreground">Threads with replies cannot be deleted by their author.</p>
          )}
        </div>
      </div>
      {error && <p id="edit-thread-error" className="mt-3 text-sm font-medium text-destructive">{error}</p>}
      {isEditing && (
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-thread-title" className="mb-1 block text-sm font-medium">Title</label>
            <input id="edit-thread-title" data-testid="edit-thread-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={isPending} aria-describedby={error ? "edit-thread-error edit-thread-title-error" : "edit-thread-title-error"} aria-invalid={title.trim().length < 5 || !!error} className="w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm" />
            {title.trim().length < 5 && <p id="edit-thread-title-error" className="mt-1 text-xs text-destructive">Title must be at least 5 characters.</p>}
          </div>
          <div>
            <label htmlFor="edit-thread-body" className="mb-1 block text-sm font-medium">Body</label>
            <MarkdownEditor value={content} onChange={setContent} rows={6} disabled={isPending} textareaId="edit-thread-body" textareaDescriptionId="edit-thread-body-error" textareaTestId="edit-thread-content" />
            {content.trim().length < 10 && <p id="edit-thread-body-error" className="mt-1 text-xs text-destructive">Body must be at least 10 characters.</p>}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={cancel} disabled={isPending}>Cancel</Button>
            <Button type="button" onClick={save} disabled={isPending || title.trim().length < 5 || content.trim().length < 10}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
