import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appRouter } from "@/server/api/root";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/prisma";
import { AccountStateCallout } from "@/components/account/account-state-callout";
import { createMetadata } from "@/lib/seo";
import { ReportForm } from "@/components/forum/report-form";
import { ReactionButtons } from "@/components/forum/reaction-buttons";
import { ThreadConversation } from "./client";
import { ThreadHighlightProvider } from "@/components/forum/thread-highlight-provider";
import { ThreadModerationControls } from "@/components/forum/thread-moderation-controls";
import { ThreadViewTracker } from "@/components/forum/thread-view-tracker";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { TagPill } from "@/components/forum/tag-pill";
import { isModeratorOrAbove } from "@/server/auth/permissions";
import { Pin, Lock, Eye } from "lucide-react";
import { ThreadFilters } from "@/components/forum/thread-filters";
import { getCurrentAccountState } from "@/server/auth/account-state";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string; threadSlug: string }> }): Promise<Metadata> {
  const { categorySlug, threadSlug } = await params;
  const caller = appRouter.createCaller({ db, session: null });
  try {
    const thread = await caller.thread.getBySlug({ slug: threadSlug });
    const { posts } = await caller.post.listByThread({ threadId: thread.id, limit: 1 });
    return createMetadata({
      title: thread.title,
      description: posts[0]?.content.slice(0, 160) ?? thread.title,
      path: `/forum/${thread.forum.slug}/${thread.slug}`,
    });
  } catch {
    return createMetadata({
      title: "Thread",
      description: "Forum discussion thread.",
      path: `/forum/${categorySlug}/${threadSlug}`,
      index: false,
    });
  }
}

export default async function ThreadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string; threadSlug: string }>;
  searchParams: Promise<{ postSort?: "oldest" | "newest" | "reactions"; repliesOnly?: string }>;
}) {
  const { categorySlug: forumSlug, threadSlug } = await params;
  const sp = await searchParams;
  const session = await auth();
  const accountState = await getCurrentAccountState(session);
  const caller = appRouter.createCaller({
    db,
    session: session?.user
      ? {
          user: {
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.name ?? null,
            role: session.user.role,
            isSuspended: session.user.isSuspended,
          },
          expires: session.expires,
        }
      : null,
  });

  let thread;
  try {
    thread = await caller.thread.getBySlug({ slug: threadSlug });
  } catch {
    notFound();
  }

  const { posts } = await caller.post.listByThread({
    threadId: thread.id,
    limit: 100,
    sort: sp.postSort ?? "oldest",
    repliesOnly: sp.repliesOnly === "1" || undefined,
  });
  const { posts: originalPosts } = await caller.post.listByThread({
    threadId: thread.id,
    limit: 1,
    sort: "oldest",
  });
  const originalPost = originalPosts[0];
  const canReply = accountState.kind === "ready" && !thread.isLocked;
  const canModerate = isModeratorOrAbove(session?.user?.role);
  const moderationForums = canModerate ? await caller.forum.listForModeration() : [];

  const breadcrumbItems = [
    { label: "Forums", href: "/forums" },
    { label: thread.forum.category.section.name },
    { label: thread.forum.category.name, href: `/category/${thread.forum.category.slug}` },
    { label: thread.forum.name, href: `/forum/${thread.forum.slug}` },
    { label: thread.title },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <ThreadViewTracker threadId={thread.id} />

      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      {/* ── Thread Header ── */}
      <article className="border-b-2 border-border pb-6 mb-8">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {thread.isPinned && (
              <span className="badge-lime flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Pinned
              </span>
            )}
            {thread.isLocked && (
              <span className="badge-amber flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Locked
              </span>
            )}
          </div>
        </div>

        <h1 className="heading-xl mb-3">{thread.title}</h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {thread.author.displayName ?? thread.author.username}
          </span>
          <span className="text-border">·</span>
          <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {thread.viewCount} views
          </span>
          <span className="text-border">·</span>
          <span>{posts.length} posts</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <ReactionButtons
            targetId={thread.id}
            targetType="thread"
            reactions={thread.reactions}
            currentUserId={session?.user?.id}
          />
          <ReportForm
            targetId={thread.id}
            targetType="thread"
            categorySlug={forumSlug}
            threadSlug={threadSlug}
            accountState={accountState}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <ThreadFilters forumSlug={forumSlug} threadSlug={threadSlug} />
        </div>

        {thread.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {thread.tags.map((tag) => (
              <TagPill key={tag.id} tag={tag} />
            ))}
          </div>
        )}
      </article>

      {/* ── Moderation Controls ── */}
      {canModerate && (
        <div className="mb-8">
          <ThreadModerationControls
            threadId={thread.id}
            isLocked={thread.isLocked}
            isPinned={thread.isPinned}
            currentForumId={thread.forum.id}
            forums={moderationForums}
          />
        </div>
      )}

      {/* ── Conversation ── */}
      <ThreadHighlightProvider>
        <ThreadConversation
          posts={posts}
          threadTitle={thread.title}
          originalPost={originalPost ? { id: originalPost.id, content: originalPost.content } : null}
          replyCount={thread.replyCount}
          threadId={thread.id}
          categorySlug={forumSlug}
          threadSlug={threadSlug}
          currentUserId={session?.user?.id}
          canReply={canReply}
          accountState={accountState}
          isThreadOwner={accountState.kind !== "suspended" && session?.user?.id === thread.author.id}
        />
      </ThreadHighlightProvider>

      {thread.isLocked && (
        <div className="mt-8 rounded-md border-2 border-warning bg-warning/5 px-4 py-3 text-sm text-warning font-medium">
          This thread is locked. No new replies can be posted.
        </div>
      )}

      {!thread.isLocked && accountState.kind !== "ready" && (
        <AccountStateCallout accountState={accountState} action="reply" className="mt-8" />
      )}

    </div>
  );
}
