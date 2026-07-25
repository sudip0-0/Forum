"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { deleteOwnReply, updateOwnReply } from "@/app/(public)/forum/[categorySlug]/[threadSlug]/actions";
import { Pencil, Trash2 } from "lucide-react";

export function ReplyOwnerControls({
  postId,
  initialContent,
  categorySlug,
  threadSlug,
}: {
  postId: string;
  initialContent: string;
  categorySlug: string;
  threadSlug: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function cancel() {
    setContent(initialContent);
    setError(null);
    setIsEditing(false);
  }

  async function save() {
    setError(null);
    setIsPending(true);
    try {
      const result = await updateOwnReply(categorySlug, threadSlug, { postId, content });
      if (result.error) setError(result.error);
      else {
        setIsEditing(false);
        window.location.reload();
      }
    } finally {
      setIsPending(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this reply? This cannot be undone by you.")) return;
    setError(null);
    setIsPending(true);
    try {
      const result = await deleteOwnReply(categorySlug, threadSlug, { postId });
      if (result.error) setError(result.error);
      else window.location.reload();
    } finally {
      setIsPending(false);
    }
  }

  if (!isEditing) {
    return (
      <>
        {error && <span className="text-xs text-destructive">{error}</span>}
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(true)} disabled={isPending} className="text-xs gap-1">
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={isPending} className="text-xs gap-1 text-destructive hover:text-destructive">
          <Trash2 className="h-3 w-3" />
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </>
    );
  }

  return (
    <div className="basis-full space-y-3 pt-3">
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      <label htmlFor={`edit-reply-${postId}`} className="sr-only">Edit reply</label>
      <MarkdownEditor value={content} onChange={setContent} rows={5} disabled={isPending} textareaId={`edit-reply-${postId}`} textareaDescriptionId={`edit-reply-${postId}-error`} textareaTestId={`edit-reply-${postId}`} />
      {content.trim().length === 0 && <p id={`edit-reply-${postId}-error`} className="text-xs text-destructive">Reply body is required.</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={cancel} disabled={isPending}>Cancel</Button>
        <Button type="button" size="sm" onClick={save} disabled={isPending || content.trim().length === 0}>
          {isPending ? "Saving..." : "Save reply"}
        </Button>
      </div>
    </div>
  );
}
