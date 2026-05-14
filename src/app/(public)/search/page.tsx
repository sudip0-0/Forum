import Link from "next/link";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const caller = appRouter.createCaller({ db, session: null });

  let results: { id: string; title: string; slug: string; createdAt: Date; authorUsername: string; authorDisplayName: string | null; categorySlug: string; categoryName: string }[] = [];

  if (q?.trim()) {
    try {
      const data = await caller.search.query({ q: q.trim() });
      results = data.results;
    } catch {
      // invalid query — show empty
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Search</h1>
      <form className="mt-4" action="/search" method="GET">
        <input
          name="q"
          defaultValue={q ?? ""}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search threads..."
        />
      </form>

      {!q?.trim() ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Enter a search term to find threads.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No results found for &ldquo;{q}&rdquo;.
        </p>
      ) : (
        <ul className="mt-8 divide-y rounded-lg border">
          {results.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <Link
                href={`/forum/${r.categorySlug}/${r.slug}`}
                className="text-sm font-medium hover:underline"
              >
                {r.title}
              </Link>
              <div className="mt-1 text-xs text-muted-foreground">
                by {r.authorDisplayName ?? r.authorUsername} in {r.categoryName}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
