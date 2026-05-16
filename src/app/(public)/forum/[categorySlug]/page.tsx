import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appRouter } from "@/server/api/root";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/prisma";
import { createMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { TagPill } from "@/components/forum/tag-pill";
import { ForumFilters } from "@/components/forum/forum-filters";
import { MessageSquare, Plus, Pin, Lock } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug: forumSlug } = await params;
  const caller = appRouter.createCaller({ db, session: null });
  try {
    const forum = await caller.forum.getBySlug({ slug: forumSlug });
    return createMetadata({
      title: forum.name,
      description: forum.description ?? `Browse public threads in ${forum.name}.`,
      path: `/forum/${forum.slug}`,
    });
  } catch {
    return createMetadata({
      title: "Forum",
      description: "Browse forum discussions.",
      path: `/forum/${forumSlug}`,
      index: false,
    });
  }
}

export default async function ForumThreadListPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{
    sort?: string;
    direction?: "asc" | "desc";
    pinnedOnly?: string;
    tagSlug?: string;
    authorUsername?: string;
    updatedWithinDays?: string;
    unanswered?: string;
  }>;
}) {
  const { categorySlug: forumSlug } = await params;
  const sp = await searchParams;

  const sort = (sp.sort || "latest") as string;
  const direction = (sp.direction || "desc") as "asc" | "desc";
  const pinnedOnly = sp.pinnedOnly === "1";
  const tagSlug = sp.tagSlug;
  const authorUsername = sp.authorUsername;
  const updatedWithinDays = sp.updatedWithinDays ? parseInt(sp.updatedWithinDays, 10) : undefined;
  const unanswered = sp.unanswered === "1";

  const session = await auth();
  const caller = appRouter.createCaller({
    db,
    session: session?.user
      ? { user: { id: session.user.id, email: session.user.email ?? "", name: session.user.name ?? null, role: session.user.role }, expires: session.expires }
      : null,
  });

  let data;
  try {
    data = await caller.thread.listByForum({
      forumSlug,
      sort: sort as "latest" | "newest" | "oldest" | "views" | "reactions" | "reacted" | "replies" | "title" | "unanswered",
      direction,
      pinnedOnly: pinnedOnly || undefined,
      tagSlug,
      authorUsername,
      updatedWithinDays,
      unanswered: unanswered || undefined,
    });
  } catch {
    notFound();
  }

  const { threads, forum } = data;
  const hasActiveFilters = !!(pinnedOnly || tagSlug || authorUsername || updatedWithinDays || unanswered);

  const breadcrumbItems = [
    { label: "Forums", href: "/forums" },
    { label: forum.category.section.name },
    { label: forum.category.name, href: `/category/${forum.category.slug}` },
    { label: forum.name },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      <div className="flex flex-wrap items-start justify-between gap-4 page-header">
        <div>
          <h1 className="heading-xl">{forum.name}</h1>
          {forum.description && <p className="mt-1 text-sm text-muted-foreground">{forum.description}</p>}
        </div>
        {session?.user && !forum.isLocked && (
          <Link
            href={`/forum/${forumSlug}/new`}
            className="inline-flex items-center gap-2 rounded-md border-2 border-border bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[3px_3px_0px_var(--border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:no-underline"
          >
            <Plus className="h-4 w-4" />
            New Thread
          </Link>
        )}
      </div>

      <ForumFilters forumSlug={forumSlug} />

      {threads.length === 0 ? (
        <div className="empty-state mt-6">
          <div className="empty-state-icon">
            <MessageSquare className="h-10 w-10" />
          </div>
          <p className="empty-state-title">{hasActiveFilters ? "No matching threads" : "No threads yet"}</p>
          <p className="empty-state-text">
            {hasActiveFilters
              ? "No threads match the current filters. Clear filters or try a broader view."
              : "No threads yet. Start the first discussion in this forum."}
          </p>
          {hasActiveFilters ? (
            <Link
              href={`/forum/${forumSlug}`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border-2 border-border bg-background px-4 py-2 text-sm font-semibold shadow-[2px_2px_0px_var(--border)] hover:no-underline"
            >
              Clear filters
            </Link>
          ) : session?.user && !forum.isLocked ? (
            <Link
              href={`/forum/${forumSlug}/new`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border-2 border-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[2px_2px_0px_var(--border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:no-underline"
            >
              <Plus className="h-4 w-4" />
              Create Thread
            </Link>
          ) : !session?.user ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border-2 border-border bg-background px-4 py-2 text-sm font-semibold shadow-[2px_2px_0px_var(--border)] hover:no-underline"
              >
                Log in to post
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center rounded-md border-2 border-border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[2px_2px_0px_var(--border)] hover:no-underline"
              >
                Create account
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="section-panel mt-6">
          <div className="divide-y divide-border">
            {threads.map((thread) => (
              <div key={thread.id} className="row-dense">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {(thread.isPinned || thread.isLocked) && (
                      <span className="flex items-center gap-1">
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
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/forum/${forumSlug}/${thread.slug}`}
                    className="text-sm font-semibold hover:text-link hover:no-underline leading-snug"
                  >
                    {thread.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{thread.author.displayName ?? thread.author.username}</span>
                    <span className="text-border">·</span>
                    <span>{thread.replyCount} replies</span>
                    <span className="text-border">·</span>
                    <span>{thread.viewCount} views</span>
                    <span className="text-border">·</span>
                    <span>{thread._count.reactions} reactions</span>
                    <span className="text-border">·</span>
                    <span>{new Date(thread.lastActivityAt).toLocaleDateString()}</span>
                  </div>
                  {thread.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {thread.tags.map((tag) => (
                        <TagPill key={tag.id} tag={tag} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {forum.isLocked && (
        <div className="mt-6 rounded-md border-2 border-warning bg-warning/5 px-4 py-3 text-sm text-warning font-medium">
          This forum is locked. No new threads or replies can be posted.
        </div>
      )}
    </div>
  );
}
