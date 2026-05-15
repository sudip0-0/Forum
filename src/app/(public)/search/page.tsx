import type { Metadata } from "next";
import Link from "next/link";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";

export const metadata: Metadata = {
  title: "Search",
  description: "Search forum threads by title, content, and filters.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; forum?: string; tag?: string; author?: string; from?: string; to?: string }>;
}) {
  const { q, forum, tag, author, from, to } = await searchParams;

  const caller = appRouter.createCaller({ db, session: null });

  const forums = await caller.section.listPublicTree();

  const allForums: { slug: string; name: string; section: string }[] = [];
  for (const s of forums) {
    for (const c of s.categories) {
      for (const f of c.forums) {
        allForums.push({ slug: f.slug, name: f.name, section: s.name });
      }
    }
  }

  type ResultRow = {
    id: string; title: string; slug: string; createdAt: string;
    authorUsername: string; authorDisplayName: string | null;
    forumSlug: string; forumName: string; tags: string; snippet: string;
  };
  let results: ResultRow[] = [];
  let searchError: string | null = null;

  if (q?.trim()) {
    try {
      const data = await caller.search.query({
        q: q.trim(),
        forumSlug: forum || undefined,
        tagSlug: tag || undefined,
        authorUsername: author || undefined,
        dateFrom: from || undefined,
        dateTo: to || undefined,
      });
      results = data.results.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch (error) {
      searchError = (error as Error).message || "Search filters are invalid.";
    }
  }

  const selectedForum = forum ?? "";
  const selectedTag = tag ?? "";
  const selectedAuthor = author ?? "";
  const selectedFrom = from ?? "";
  const selectedTo = to ?? "";

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Search</h1>

      <form className="mt-4 space-y-3" action="/search" method="GET">
        <input
          name="q"
          defaultValue={q ?? ""}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search threads..."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Forum</label>
            <select name="forum" defaultValue={selectedForum} className="w-full rounded-md border bg-background px-2 py-1.5 text-sm">
              <option value="">All forums</option>
              {allForums.map((f) => (
                <option key={f.slug} value={f.slug}>{f.name} ({f.section})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tag</label>
            <input name="tag" defaultValue={selectedTag} className="w-full rounded-md border px-2 py-1.5 text-sm" placeholder="e.g. help" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Author</label>
            <input name="author" defaultValue={selectedAuthor} className="w-full rounded-md border px-2 py-1.5 text-sm" placeholder="username" />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
              <input type="date" name="from" defaultValue={selectedFrom} className="w-full rounded-md border px-2 py-1.5 text-sm" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
              <input type="date" name="to" defaultValue={selectedTo} className="w-full rounded-md border px-2 py-1.5 text-sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Search
          </button>
          {(forum || tag || author || from || to) && (
            <a href={`/search?q=${encodeURIComponent(q ?? "")}`} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
              Clear filters
            </a>
          )}
        </div>
      </form>

      {!q?.trim() ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Enter a search term to find threads.
        </p>
      ) : (
        <>
          {searchError ? (
            <p className="mt-8 text-sm text-destructive">{searchError}</p>
          ) : results.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">
              No results found for &ldquo;{q}&rdquo;{forum ? ` in ${allForums.find((f) => f.slug === forum)?.name}` : ""}.
            </p>
          ) : (
            <>
              <p className="mt-6 text-xs text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;{forum ? ` in forum` : ""}
              </p>
              <ul className="mt-3 divide-y rounded-lg border">
                {results.map((r) => (
                  <li key={r.id} className="px-4 py-3">
                    <Link href={`/forum/${r.forumSlug}/${r.slug}`} className="text-sm font-medium hover:underline">
                      {r.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>by {r.authorDisplayName ?? r.authorUsername}</span>
                      <span>in {r.forumName}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      {r.tags && (
                        <span className="flex gap-1">
                          {r.tags.split(", ").map((tagName) => (
                            <span key={tagName} className="rounded bg-muted px-1.5 py-0.5 text-xs">{tagName}</span>
                          ))}
                        </span>
                      )}
                    </div>
                    {r.snippet && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {r.snippet.slice(0, 200)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </main>
  );
}
