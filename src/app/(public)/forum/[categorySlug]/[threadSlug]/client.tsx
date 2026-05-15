"use client";

import { useRef, useState, useTransition, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/forum/markdown";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { ReactionButtons } from "@/components/forum/reaction-buttons";
import { ReportForm } from "@/components/forum/report-form";
import { createReply } from "./actions";

type PostItem = {
  id: string;
  content: string;
  createdAt: Date;
  parent: {
    id: string;
    author: { username: string; displayName: string | null };
  } | null;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    image: string | null;
    createdAt: Date;
    _count: { posts: number };
  };
  reactions: { userId: string; emoji: string }[];
};

function initials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

export function ThreadConversation({
  posts,
  threadId,
  categorySlug,
  threadSlug,
  currentUserId,
  canReply,
  isLoggedIn,
}: {
  posts: PostItem[];
  threadId: string;
  categorySlug: string;
  threadSlug: string;
  currentUserId?: string;
  canReply: boolean;
  isLoggedIn: boolean;
}) {
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const [replyTarget, setReplyTarget] = useState<PostItem | null>(null);

  function replyTo(post: PostItem) {
    setReplyTarget(post);
    document.getElementById("reply-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => composerRef.current?.focus());
  }

  return (
    <>
      <div className="mt-8 space-y-4">
        {posts.map((post, index) => (
          <article key={post.id} id={`post-${post.id}`} className="overflow-hidden rounded-lg border bg-card">
            <div className="grid md:grid-cols-[180px_minmax(0,1fr)]">
              <aside className="border-b bg-muted/20 p-4 md:border-b-0 md:border-r">
                <div className="flex items-center gap-3 md:flex-col md:items-start">
                  {post.author.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.author.image} alt="" className="h-14 w-14 rounded-full object-cover md:h-20 md:w-20" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-xl font-semibold text-primary md:h-20 md:w-20 md:text-3xl">
                      {initials(post.author.displayName ?? post.author.username)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{post.author.displayName ?? post.author.username}</div>
                    <div className="text-xs text-muted-foreground">@{post.author.username}</div>
                    <div className="mt-2 text-xs text-muted-foreground">Joined {new Date(post.author.createdAt).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">{post.author._count.posts} posts</div>
                  </div>
                </div>
              </aside>
              <div className="flex min-h-44 flex-col p-4">
                <div className="flex items-start gap-3 text-xs text-muted-foreground">
                  <span>{new Date(post.createdAt).toLocaleString()}</span>
                  <span className="ml-auto">#{index + 1}</span>
                </div>
                {post.parent && (
                  <a href={`#post-${post.parent.id}`} className="mt-3 text-xs text-primary hover:underline">
                    Replied to @{post.parent.author.displayName ?? post.parent.author.username}
                  </a>
                )}
                <div className="mt-4 flex-1 text-sm">
                  <Markdown content={post.content} />
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                  <ReactionButtons
                    targetId={post.id}
                    targetType="post"
                    reactions={post.reactions}
                    currentUserId={currentUserId}
                  />
                  <div className="flex items-center gap-4 text-sm">
                    {isLoggedIn && <ReportForm targetId={post.id} targetType="post" categorySlug={categorySlug} threadSlug={threadSlug} />}
                    {canReply && (
                      <button type="button" onClick={() => replyTo(post)} className="text-muted-foreground hover:text-foreground">
                        Reply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {canReply && (
        <ReplyComposer
          textareaRef={composerRef}
          threadId={threadId}
          categorySlug={categorySlug}
          threadSlug={threadSlug}
          replyTarget={replyTarget}
          onClearReplyTarget={() => setReplyTarget(null)}
        />
      )}
    </>
  );
}

function ReplyComposer({
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
  replyTarget: PostItem | null;
  onClearReplyTarget: () => void;
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
        parentId: replyTarget?.id,
        content,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setContent("");
        onClearReplyTarget();
        router.refresh();
      }
    });
  }

  return (
    <section id="reply-composer" className="mt-8 rounded-lg border bg-card p-4">
      <div className="flex gap-4">
        <div className="hidden sm:block">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-xl font-semibold text-primary">R</div>
        </div>
        <div className="min-w-0 flex-1">
          {replyTarget && (
            <div className="mb-3 flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-xs">
              <span>Replying to @{replyTarget.author.displayName ?? replyTarget.author.username}</span>
              <button type="button" onClick={onClearReplyTarget} className="text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          )}
          {error && <div className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Write your reply here..."
            rows={7}
            disabled={isPending}
            textareaId="thread-reply-textarea"
            textareaName="content"
            textareaTestId="reply-content"
            textareaRef={textareaRef}
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={handleSubmit} disabled={isPending || !content.trim()}>
              Post reply
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
