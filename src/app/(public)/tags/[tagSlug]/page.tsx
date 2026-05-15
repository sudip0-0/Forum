import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db/prisma";
import { appRouter } from "@/server/api/root";
import { TagPill } from "@/components/forum/tag-pill";
import { Hash, ArrowLeft } from "lucide-react";

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
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href="/forums"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:no-underline mb-4"
      >
        <ArrowLeft className="h-3 w-3" />
        Forums
      </Link>

      <div className="page-header">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="heading-xl flex items-center gap-2">
            <Hash className="h-6 w-6 text-primary" />
            {tag.name}
          </h1>
          <span className="badge-orange">{threads.length} thread{threads.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Sort & Filter */}
      <div className="filter-panel mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
            Sort:
          </span>
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={`/tags/${tagSlug}?sort=${opt.value}&direction=${direction}`}
              className={`rounded-sm border-2 px-3 py-1.5 text-xs font-semibold transition-all hover:no-underline ${
                sort === opt.value
                  ? "bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_var(--border)]"
                  : "bg-background text-foreground border-border shadow-[1px_1px_0px_var(--border)] hover:bg-accent"
              }`}
            >
              {opt.label}
            </Link>
          ))}
          <span className="mx-1 text-border">|</span>
          <Link
            href={`/tags/${tagSlug}?sort=${sort}&direction=${direction === "asc" ? "desc" : "asc"}`}
            className={`rounded-sm border-2 px-3 py-1.5 text-xs font-semibold transition-all hover:no-underline ${
              "bg-background text-foreground border-border shadow-[1px_1px_0px_var(--border)] hover:bg-accent"
            }`}
          >
            {direction === "asc" ? "Ascending ↑" : "Descending ↓"}
          </Link>
        </div>
      </div>

      {threads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Hash className="h-10 w-10" />
          </div>
          <p className="empty-state-title">No threads with this tag</p>
          <p className="empty-state-text">Threads tagged with &ldquo;{tag.name}&rdquo; will appear here.</p>
        </div>
      ) : (
        <div className="section-panel">
          <div className="divide-y divide-border">
            {threads.map((thread) => (
              <div key={thread.id} className="row-dense">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/forum/${thread.forum.slug}/${thread.slug}`}
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
                    <span className="text-border">·</span>
                    <span>
                      in{" "}
                      <Link href={`/forum/${thread.forum.slug}`} className="hover:text-foreground hover:underline">
                        {thread.forum.name}
                      </Link>
                    </span>
                  </div>
                  {thread.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {thread.tags.map((t) => (
                        <TagPill key={t.id} tag={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
