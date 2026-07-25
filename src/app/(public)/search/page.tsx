import type { Metadata } from "next";
import Link from "next/link";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { createMetadata } from "@/lib/seo";
import { highlightSnippet } from "@/lib/highlight";
import { buildSearchResultLink } from "@/lib/search-link";
import { buildCursorHref, parseSearchCursor, serializeSearchCursor } from "@/lib/pagination";
import { TagPill } from "@/components/forum/tag-pill";
import { HighlightedText } from "@/components/forum/highlighted-text";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { Search, SlidersHorizontal, X, ArrowRight, Calendar } from "lucide-react";

export const metadata: Metadata = createMetadata({
  title: "Search",
  description: "Search public forum threads by title, content, and filters.",
  path: "/search",
  index: false,
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; forum?: string; tag?: string; author?: string; from?: string; to?: string; cursor?: string }>;
}) {
  const { q, forum, tag, author, from, to, cursor } = await searchParams;

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
    forumSlug: string; forumName: string; tags: { id: string; name: string; slug: string }[]; snippet: string;
    matchedPostId: string;
  };
  let results: ResultRow[] = [];
  let nextCursor: string | null = null;
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
        cursor: parseSearchCursor(cursor),
        limit: 20,
      });
      results = data.results.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }));
      nextCursor = serializeSearchCursor(data.nextCursor);
    } catch (error) {
      searchError = (error as Error).message || "Search filters are invalid.";
    }
  }

  const selectedForum = forum ?? "";
  const selectedTag = tag ?? "";
  const selectedAuthor = author ?? "";
  const selectedFrom = from ?? "";
  const selectedTo = to ?? "";

  const hasActiveFilters = !!(forum || tag || author || from || to);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} className="mb-4" />
      <div className="page-header">
        <h1 className="heading-xl">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find threads by title, content, author, and more.
        </p>
      </div>

      <form className="space-y-4" action="/search" method="GET">
        {/* Search Input */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <label htmlFor="forum-search" className="sr-only">Search threads</label>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="forum-search"
              name="q"
              defaultValue={q ?? ""}
              className="w-full rounded-md border-2 border-border bg-card py-3 pl-10 pr-4 text-sm shadow-[2px_2px_0px_var(--border)] outline-none focus:shadow-[1px_1px_0px_var(--border)] focus:translate-x-[1px] focus:translate-y-[1px] transition-all"
              placeholder="Search threads..."
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md border-2 border-border bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[2px_2px_0px_var(--border)] transition-shadow hover:shadow-[1px_1px_0px_var(--border)] active:shadow-none shrink-0"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="filter-panel overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</span>
              {hasActiveFilters && (
                <span className="badge-orange text-xs">Active</span>
              )}
            </div>
            {hasActiveFilters && (
              <a
                href={`/search?q=${encodeURIComponent(q ?? "")}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:no-underline transition-colors"
              >
                <X className="h-3 w-3" />
                Clear
              </a>
            )}
          </div>

          {/* Row 1: Forum, Tag, Author */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div>
              <label htmlFor="search-forum" className="mb-1 block text-xs font-semibold text-muted-foreground">Forum</label>
              <select id="search-forum" name="forum" defaultValue={selectedForum} className="w-full rounded-sm border-2 border-border bg-background px-2.5 py-2 text-sm shadow-[1px_1px_0px_var(--border)]">
                <option value="">All forums</option>
                {allForums.map((f) => (
                  <option key={f.slug} value={f.slug}>{f.name} ({f.section})</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="search-tag" className="mb-1 block text-xs font-semibold text-muted-foreground">Tag</label>
              <input id="search-tag" name="tag" defaultValue={selectedTag} className="w-full rounded-sm border-2 border-border bg-background px-2.5 py-2 text-sm shadow-[1px_1px_0px_var(--border)]" placeholder="e.g. help" />
            </div>

            <div>
              <label htmlFor="search-author" className="mb-1 block text-xs font-semibold text-muted-foreground">Author</label>
              <input id="search-author" name="author" defaultValue={selectedAuthor} className="w-full rounded-sm border-2 border-border bg-background px-2.5 py-2 text-sm shadow-[1px_1px_0px_var(--border)]" placeholder="username" />
            </div>
          </div>

          {/* Row 2: Date range */}
          <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div>
              <label htmlFor="search-from" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Calendar className="h-3 w-3" />
                From
              </label>
              <input id="search-from" type="date" name="from" defaultValue={selectedFrom} className="w-full min-w-0 rounded-sm border-2 border-border bg-background px-2.5 py-2 text-sm shadow-[1px_1px_0px_var(--border)]" />
            </div>
            <div>
              <label htmlFor="search-to" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Calendar className="h-3 w-3" />
                To
              </label>
              <input id="search-to" type="date" name="to" defaultValue={selectedTo} className="w-full min-w-0 rounded-sm border-2 border-border bg-background px-2.5 py-2 text-sm shadow-[1px_1px_0px_var(--border)]" />
            </div>
          </div>
        </div>
      </form>

      {/* Results */}
      {!q?.trim() ? (
        <div className="empty-state mt-8">
          <div className="empty-state-icon">
            <Search className="h-10 w-10" />
          </div>
          <p className="empty-state-title">Search the forums</p>
          <p className="empty-state-text">
            Enter a search term above to find threads, posts, and discussions.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          {searchError ? (
            <div className="rounded-md border-2 border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium">
              {searchError}
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Search className="h-10 w-10" />
              </div>
              <p className="empty-state-title">No results found</p>
              <p className="empty-state-text">
                No results for &ldquo;{q}&rdquo;{forum ? ` in ${allForums.find((f) => f.slug === forum)?.name}` : ""}.
                Try a shorter query, remove filters, or browse{" "}
                <a href="/forums" className="font-semibold text-primary">
                  forums
                </a>
                .
                Try fewer words, check spelling, or browse forums instead.
              </p>
              <Link
                href="/forums"
                className="mt-4 inline-flex items-center rounded-md border-2 border-border bg-background px-4 py-2 text-sm font-semibold shadow-[2px_2px_0px_var(--border)] hover:no-underline"
              >
                Browse forums
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold">
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </span>
                <span className="text-muted-foreground text-xs">for &ldquo;{q}&rdquo;</span>
              </div>
              <div className="section-panel">
                <div className="divide-y divide-border">
                  {results.map((r) => (
                    <div key={r.id} className="row-dense">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={buildSearchResultLink({ forumSlug: r.forumSlug, threadSlug: r.slug, query: q, matchedPostId: r.matchedPostId })}
                          className="text-sm font-semibold hover:text-link hover:no-underline leading-snug"
                        >
                          {r.title}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span>by {r.authorDisplayName ?? r.authorUsername}</span>
                          <span className="text-border">·</span>
                          <span>in {r.forumName}</span>
                          <span className="text-border">·</span>
                          <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        {r.snippet && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            <HighlightedText segments={highlightSnippet(r.snippet, q)} />
                          </p>
                        )}
                        {r.tags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {r.tags.map((tag) => (
                              <TagPill key={tag.id} tag={tag} className="px-1.5" />
                            ))}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
              {nextCursor && (
                <div className="mt-6 flex justify-center">
                  <Link
                    href={buildCursorHref(
                      "/search",
                      { q, forum, tag, author, from, to },
                      nextCursor,
                    )}
                    className="inline-flex min-h-[44px] items-center rounded-md border-2 border-border bg-background px-4 py-2 text-sm font-semibold shadow-[2px_2px_0px_var(--border)] hover:no-underline"
                  >
                    Next page
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
