"use client";

import { useRef, useState, useTransition, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/forum/markdown";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { ReactionButtons } from "@/components/forum/reaction-buttons";
import { ReportForm } from "@/components/forum/report-form";
import { createReply } from "./actions";
import { MessageSquare, Reply } from "lucide-react";

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
  return name.slice(0, 2).toUpperCase();
}

function getColorForUser(userId: string) {
  const colors = [
    "bg-primary/15 text-primary",
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
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
      {/* ── Conversation Thread ── */}
      <div className="space-y-6">
        {posts.map((post, index) => (
          <article
            key={post.id}
            id={`post-${post.id}`}
            className="card-elevated overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row">
              {/* ── Author Rail ── */}
              <aside className="sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r-2 border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                  {post.author.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.author.image}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border-2 border-border object-cover sm:h-14 sm:w-14"
                    />
                  ) : (
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border text-sm font-bold sm:h-14 sm:w-14 sm:text-lg ${getColorForUser(post.author.id)}`}
                    >
                      {initials(post.author.displayName ?? post.author.username)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold leading-tight">
                      {post.author.displayName ?? post.author.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{post.author.username}
                    </div>
                    <div className="mt-2 hidden text-xs text-muted-foreground sm:block">
                      <div>Joined {new Date(post.author.createdAt).toLocaleDateString()}</div>
                      <div>{post.author._count.posts} posts</div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* ── Message Content ── */}
              <div className="flex min-h-32 flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                  </div>
                  <span className="shrink-0 rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-xs text-muted-foreground shadow-[1px_1px_0px_var(--border)]">
                    #{index + 1}
                  </span>
                </div>

                {post.parent && (
                  <a
                    href={`#post-${post.parent.id}`}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-link hover:border-link hover:no-underline transition-colors"
                  >
                    <Reply className="h-3 w-3" />
                    Replied to @{post.parent.author.displayName ?? post.parent.author.username}
                  </a>
                )}

                <div className="mt-4 flex-1 text-sm leading-relaxed prose prose-sm max-w-none">
                  <Markdown content={post.content} />
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <ReactionButtons
                    targetId={post.id}
                    targetType="post"
                    reactions={post.reactions}
                    currentUserId={currentUserId}
                  />
                  <div className="flex items-center gap-2">
                    {isLoggedIn && (
                      <ReportForm
                        targetId={post.id}
                        targetType="post"
                        categorySlug={categorySlug}
                        threadSlug={threadSlug}
                      />
                    )}
                    {canReply && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => replyTo(post)}
                        className="text-xs gap-1"
                      >
                        <Reply className="h-3 w-3" />
                        Reply
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mobile metadata */}
                <div className="mt-3 flex gap-3 text-xs text-muted-foreground sm:hidden">
                  <span>Joined {new Date(post.author.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{post.author._count.posts} posts</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ── Reply Composer ── */}
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
              {typeof window !== "undefined" ? JSON.parse(localStorage.getItem("initials") ?? '"R"') : "R"}
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
              <div className="mb-3 rounded-sm border-2 border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
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
              textareaName="content"
              textareaTestId="reply-content"
              textareaRef={textareaRef}
            />

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
