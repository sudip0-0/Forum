import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appRouter } from "@/server/api/root";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/prisma";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { TagPill } from "@/components/forum/tag-pill";
import { ForumFilters } from "@/components/forum/forum-filters";

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug: forumSlug } = await params;
  const caller = appRouter.createCaller({ db, session: null });
  try {
    const forum = await caller.forum.getBySlug({ slug: forumSlug });
    return { title: forum.name, description: forum.description ?? `Threads in ${forum.name}` };
  } catch {
    return { title: "Forum" };
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

  const breadcrumbItems = [
    { label: "Forums", href: "/forums" },
    { label: forum.category.section.name },
    { label: forum.category.name, href: `/category/${forum.category.slug}` },
    { label: forum.name },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Breadcrumbs items={breadcrumbItems} className="mb-2" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{forum.name}</h1>
          {forum.description && <p className="mt-1 text-sm text-muted-foreground">{forum.description}</p>}
        </div>
        {session?.user && !forum.isLocked && (
          <Link href={`/forum/${forumSlug}/new`} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            New Thread
          </Link>
        )}
      </div>

      <div className="mt-4">
        <ForumFilters forumSlug={forumSlug} />
      </div>

      {threads.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No threads yet.</p>
      ) : (
        <ul className="mt-4 divide-y rounded-lg border">
          {threads.map((thread) => (
            <li key={thread.id} className="px-4 py-3">
              <div className="flex items-start gap-2">
                {thread.isPinned && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">Pinned</span>
                )}
                {thread.isLocked && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Locked</span>
                )}
              </div>
              <Link href={`/forum/${forumSlug}/${thread.slug}`} className="block hover:underline">
                <span className="text-sm font-medium">{thread.title}</span>
              </Link>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{thread.author.displayName ?? thread.author.username}</span>
                <span>{thread.replyCount} replies</span>
                <span>{thread.viewCount} views</span>
                <span>{thread._count.reactions} reactions</span>
                <span>{new Date(thread.lastActivityAt).toLocaleDateString()}</span>
              </div>
              {thread.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {thread.tags.map((tag) => (
                    <TagPill key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
