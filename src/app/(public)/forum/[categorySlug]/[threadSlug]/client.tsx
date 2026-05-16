"use client";

import { useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/forum/markdown";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import { ReactionButtons } from "@/components/forum/reaction-buttons";
import { ReportForm } from "@/components/forum/report-form";
import { createReply, deleteOwnReply, deleteOwnThread, updateOwnReply, updateOwnThread } from "./actions";
import { MessageSquare, Pencil, Reply, Trash2 } from "lucide-react";

type PostItem = {
  id: string;
  content: string;
  createdAt: Date;
  parent: {
    id: string;
    isDeleted: boolean;
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
  threadTitle,
  originalPost,
  replyCount,
  threadId,
  categorySlug,
  threadSlug,
  currentUserId,
  canReply,
  isLoggedIn,
  isThreadOwner,
}: {
  posts: PostItem[];
  threadTitle: string;
  originalPost: { id: string; content: string } | null;
  replyCount: number;
  threadId: string;
  categorySlug: string;
  threadSlug: string;
  currentUserId?: string;
  canReply: boolean;
  isLoggedIn: boolean;
  isThreadOwner: boolean;
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
      {isThreadOwner && originalPost && (
        <ThreadOwnerControls
          threadId={threadId}
          threadTitle={threadTitle}
          threadContent={originalPost.content}
          replyCount={replyCount}
          categorySlug={categorySlug}
          threadSlug={threadSlug}
        />
      )}
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

                {post.parent && !post.parent.isDeleted && (
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
                    {currentUserId === post.author.id && post.id !== originalPost?.id && (
                      <ReplyOwnerControls
                        postId={post.id}
                        initialContent={post.content}
                        categorySlug={categorySlug}
                        threadSlug={threadSlug}
                      />
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

function ThreadOwnerControls({
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
        window.location.reload();
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
        router.push(`/forum/${categorySlug}`);
        router.refresh();
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
      {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
      {isEditing && (
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-thread-title" className="mb-1 block text-sm font-medium">Title</label>
            <input id="edit-thread-title" data-testid="edit-thread-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={isPending} aria-describedby="edit-thread-title-error" aria-invalid={title.trim().length < 5} className="w-full rounded-sm border-2 border-border bg-background px-3 py-2 text-sm" />
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

function ReplyOwnerControls({
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
              textareaDescriptionId="thread-reply-hint"
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
