"use client";

import { useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { createReply } from "@/app/(public)/forum/[categorySlug]/[threadSlug]/actions";
import { MessageSquare, Reply } from "lucide-react";

export type ReplyTarget = {
  id: string;
  author: { username: string; displayName: string | null };
};

export function ReplyComposer({
  textareaRef,
  threadId,
  categorySlug,
  threadSlug,
  replyTarget,
  onClearReplyTarget,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  threadId: string;
  categorySlug: string;
  threadSlug: string;
  replyTarget: ReplyTarget | null;
  onClearReplyTarget: () => void;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsPending(true);
    try {
      const result = await createReply(categorySlug, threadSlug, {
        threadId,
        parentId: replyTarget?.id,
        content,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setContent("");
        onClearReplyTarget();
        window.location.reload();
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section
      id="reply-composer"
      className="mt-10 rounded-md border-2 border-border bg-card shadow-[3px_3px_0px_var(--border)]"
    >
      <div className="border-b-2 border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4 text-primary" />
          {replyTarget ? "Post a Reply" : "Join the Discussion"}
        </div>
      </div>

      <div className="p-5">
        <div className="flex gap-4">
          <div className="hidden sm:block">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-primary/15 text-base font-bold text-primary shadow-[1px_1px_0px_var(--border)]">
              R
            </div>
          </div>
          <div className="min-w-0 flex-1">
            {replyTarget && (
              <div className="mb-3 flex items-center justify-between rounded-sm border-2 border-border bg-muted/50 px-3 py-2 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <Reply className="h-3 w-3" />
                  Replying to @{replyTarget.author.displayName ?? replyTarget.author.username}
                </span>
                <button
                  type="button"
                  onClick={onClearReplyTarget}
                  className="rounded-sm px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {error && (
              <div id="reply-content-error" role="alert" className="mb-3 rounded-sm border-2 border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Write your reply here... (Markdown supported)"
              rows={6}
              disabled={isPending}
              textareaId="thread-reply-textarea"
              textareaDescriptionId={error ? "reply-content-error" : "thread-reply-hint"}
              textareaName="content"
              textareaTestId="reply-content"
              textareaRef={textareaRef}
            />
            <p id="thread-reply-hint" className="mt-1 text-xs text-muted-foreground">
              Add enough context for others to understand your reply.
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Markdown formatting supported
              </p>
              <Button
                onClick={handleSubmit}
                disabled={isPending || !content.trim()}
              >
                {isPending ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
