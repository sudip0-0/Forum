import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db/prisma";
import { appRouter } from "@/server/api/root";
import { TagPill } from "@/components/forum/tag-pill";

const SORT_OPTIONS = [
  { value: "latest", label: "Last message" },
  { value: "newest", label: "First message" },
  { value: "views", label: "Views" },
  { value: "replies", label: "Replies" },
  { value: "reactions", label: "Reactions" },
];

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tagSlug: string }>;
  searchParams: Promise<{ sort?: string; direction?: "asc" | "desc" }>;
}) {
  const { tagSlug } = await params;
  const sp = await searchParams;

  const sort = sp.sort || "latest";
  const direction = (sp.direction || "desc") as "asc" | "desc";

  const caller = appRouter.createCaller({ db, session: null });

  let data;
  try {
    data = await caller.discovery.listThreadsByTag({
      tagSlug,
      sort: sort as "latest" | "newest" | "oldest" | "views" | "replies" | "reactions",
      direction,
    });
  } catch {
    notFound();
  }

  const { threads, tag } = data;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/forums" className="text-xs text-muted-foreground hover:text-foreground">
        &larr; Forums
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">#{tag.name}</h1>
        <span className="text-xs text-muted-foreground">
          {threads.length} threads
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/tags/${tagSlug}?sort=${opt.value}&direction=${direction}`}
            className={`rounded-md border px-3 py-1.5 text-xs ${sort === opt.value ? "bg-accent" : ""}`}
          >
            {opt.label}
          </Link>
        ))}
        <Link
          href={`/tags/${tagSlug}?sort=${sort}&direction=${direction === "asc" ? "desc" : "asc"}`}
          className="rounded-md border px-3 py-1.5 text-xs"
        >
          {direction === "asc" ? "Ascending" : "Descending"}
        </Link>
      </div>

      {threads.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No threads with this tag yet.</p>
      ) : (
        <ul className="mt-6 divide-y rounded-lg border">
          {threads.map((thread) => (
            <li key={thread.id} className="px-4 py-3">
              <Link
                href={`/forum/${thread.forum.slug}/${thread.slug}`}
                className="block text-sm font-medium hover:underline"
              >
                {thread.title}
              </Link>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{thread.author.displayName ?? thread.author.username}</span>
                <span>{thread.replyCount} replies</span>
                <span>{thread.viewCount} views</span>
                <span>{thread._count.reactions} reactions</span>
                <span>{new Date(thread.lastActivityAt).toLocaleDateString()}</span>
                <span>
                  in{" "}
                  <Link href={`/forum/${thread.forum.slug}`} className="hover:text-foreground hover:underline">
                    {thread.forum.name}
                  </Link>
                </span>
              </div>
              {thread.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {thread.tags.map((t) => (
                    <TagPill key={t.id} tag={t} />
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tagSlug: string }>;
}) {
  const { tagSlug } = await params;
  return { title: `#${tagSlug} - Tag` };
}
