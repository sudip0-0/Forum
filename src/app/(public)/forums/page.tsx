import type { Metadata } from "next";
import Link from "next/link";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forums",
  description: "Browse sections, categories, and forums.",
};

export default async function ForumsPage() {
  const caller = appRouter.createCaller({ db, session: null });
  const sections = await caller.section.listPublicTree();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Forums</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse sections, categories, and discussion forums.
      </p>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.id}>
            <h2 className="text-lg font-semibold">{section.name}</h2>
            {section.description && <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>}
            <div className="mt-4 space-y-4">
              {section.categories.map((category) => (
                <div key={category.id} className="rounded-lg border p-4">
                  <h3 className="text-sm font-medium">{category.name}</h3>
                  {category.description && <p className="mt-1 text-xs text-muted-foreground">{category.description}</p>}
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {category.forums.map((forum) => (
                      <Link
                        key={forum.id}
                        href={`/forum/${forum.slug}`}
                        className="rounded-md border px-4 py-3 transition-colors hover:bg-accent/50"
                      >
                        <div className="text-sm font-medium">{forum.name}</div>
                        {forum.description && <div className="mt-1 text-xs text-muted-foreground">{forum.description}</div>}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
