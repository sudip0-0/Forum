import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appRouter } from "@/server/api/root";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/prisma";
import { ReportForm } from "@/components/forum/report-form";
import { ReactionButtons } from "@/components/forum/reaction-buttons";
import { ThreadConversation } from "./client";
import { ThreadModerationControls } from "@/components/forum/thread-moderation-controls";
import { ThreadViewTracker } from "@/components/forum/thread-view-tracker";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { TagPill } from "@/components/forum/tag-pill";
import { isModeratorOrAbove } from "@/server/auth/permissions";

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string; threadSlug: string }> }): Promise<Metadata> {
  const { threadSlug } = await params;
  const caller = appRouter.createCaller({ db, session: null });
  try {
    const thread = await caller.thread.getBySlug({ slug: threadSlug });
    const { posts } = await caller.post.listByThread({ threadId: thread.id, limit: 1 });
    return { title: thread.title, description: posts[0]?.content.slice(0, 160) ?? thread.title };
  } catch {
    return { title: "Thread" };
  }
}

export default async function ThreadDetailPage({ params }: { params: Promise<{ categorySlug: string; threadSlug: string }> }) {
  const { categorySlug: forumSlug, threadSlug } = await params;
  const session = await auth();
  const caller = appRouter.createCaller({
    db,
    session: session?.user
      ? { user: { id: session.user.id, email: session.user.email ?? "", name: session.user.name ?? null, role: session.user.role }, expires: session.expires }
      : null,
  });

  let thread;
  try {
    thread = await caller.thread.getBySlug({ slug: threadSlug });
  } catch {
    notFound();
  }

  const { posts } = await caller.post.listByThread({ threadId: thread.id, limit: 100 });
  const canReply = !!session?.user && !thread.isLocked;
  const isLoggedIn = !!session?.user;
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
    <main className="mx-auto max-w-5xl px-6 py-10">
      <ThreadViewTracker threadId={thread.id} />

      <Breadcrumbs items={breadcrumbItems} className="mb-2" />

      <h1 className="text-2xl font-semibold">{thread.title}</h1>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{thread.author.displayName ?? thread.author.username}</span>
        <span>·</span>
        <span>{new Date(thread.createdAt).toLocaleString()}</span>
        <span>·</span>
        <span>{thread.viewCount} views</span>
        {isLoggedIn && <span className="ml-auto"><ReportForm targetId={thread.id} targetType="thread" categorySlug={forumSlug} threadSlug={threadSlug} /></span>}
      </div>
      <div className="mt-3">
        <ReactionButtons targetId={thread.id} targetType="thread" reactions={thread.reactions} currentUserId={session?.user?.id} />
      </div>
      {thread.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {thread.tags.map((tag) => (
            <TagPill key={tag.id} tag={tag} />
          ))}
        </div>
      )}
      {canModerate && (
        <ThreadModerationControls
          threadId={thread.id}
          isLocked={thread.isLocked}
          isPinned={thread.isPinned}
          currentForumId={thread.forum.id}
          forums={moderationForums}
        />
      )}
      <ThreadConversation
        posts={posts}
        threadId={thread.id}
        categorySlug={forumSlug}
        threadSlug={threadSlug}
        currentUserId={session?.user?.id}
        canReply={canReply}
        isLoggedIn={isLoggedIn}
      />
      {thread.isLocked && <p className="mt-8 text-sm text-muted-foreground">This thread is locked. No new replies can be posted.</p>}
    </main>
  );
}
