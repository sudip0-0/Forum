import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appRouter } from "@/server/api/root";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/prisma";

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
  searchParams: Promise<{ sort?: string; direction?: "asc" | "desc" }>;
}) {
  const { categorySlug: forumSlug } = await params;
  const { sort = "latest", direction = "desc" } = await searchParams;
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
      sort: sort as "latest" | "newest" | "oldest" | "views" | "reacted" | "replies" | "unanswered",
      direction,
    });
  } catch {
    notFound();
  }
  const { threads, forum } = data;
  const sorts = ["latest", "newest", "oldest", "views", "reacted", "replies", "unanswered"] as const;
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">
            {forum.category.section.name} / {forum.category.name}
          </div>
          <h1 className="text-2xl font-semibold">{forum.name}</h1>
          {forum.description && <p className="mt-1 text-sm text-muted-foreground">{forum.description}</p>}
        </div>
        {session?.user && !forum.isLocked && (
          <Link href={`/forum/${forumSlug}/new`} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            New Thread
          </Link>
        )}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {sorts.map((item) => (
          <Link
            key={item}
            href={`/forum/${forumSlug}?sort=${item}&direction=${direction}`}
            className={`rounded-md border px-3 py-1.5 text-xs ${sort === item ? "bg-accent" : ""}`}
          >
            {item}
          </Link>
        ))}
        <Link href={`/forum/${forumSlug}?sort=${sort}&direction=${direction === "asc" ? "desc" : "asc"}`} className="rounded-md border px-3 py-1.5 text-xs">
          {direction === "asc" ? "Ascending" : "Descending"}
        </Link>
      </div>
      {threads.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No threads yet.</p>
      ) : (
        <ul className="mt-8 divide-y rounded-lg border">
          {threads.map((thread) => (
            <li key={thread.id} className="px-4 py-3">
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
              {thread.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{thread.tags.map((tag) => <span key={tag.id} className="rounded bg-muted px-2 py-0.5 text-xs">#{tag.name}</span>)}</div>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
