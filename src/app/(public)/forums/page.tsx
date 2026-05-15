import type { Metadata } from "next";
import Link from "next/link";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { MessageSquare, ChevronRight, Lock, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forums",
  description: "Browse sections, categories, and discussion forums.",
};

export default async function ForumsPage() {
  const caller = appRouter.createCaller({ db, session: null });
  const sections = await caller.section.listPublicTree();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="page-header">
        <h1 className="heading-xl">Forums</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse sections, categories, and discussion forums.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.id}>
            <div className="section-panel-header rounded-t-md">
              <span>{section.name}</span>
            </div>
            <div className="section-panel">
              {section.description && (
                <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
                  {section.description}
                </div>
              )}
              <div className="space-y-0">
                {section.categories.map((category, ci) => (
                  <div key={category.id}>
                    <div className={ci > 0 ? "border-t border-border" : ""}>
                      <div className="border-b border-border bg-muted/30 px-4 py-2">
                        <h3 className="text-sm font-semibold">{category.name}</h3>
                        {category.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="divide-y divide-border">
                        {category.forums.map((forum) => (
                          <Link
                            key={forum.id}
                            href={`/forum/${forum.slug}`}
                            className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40 hover:no-underline"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-border bg-background shadow-[1px_1px_0px_var(--border)]">
                              {forum.isLocked ? (
                                <Lock className="h-4 w-4 text-warning" />
                              ) : (
                                <MessageSquare className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{forum.name}</span>
                                {!forum.isPublic && (
                                  <span className="badge-amber flex items-center gap-1">
                                    <EyeOff className="h-3 w-3" />
                                    Hidden
                                  </span>
                                )}
                                {forum.isLocked && (
                                  <span className="badge-amber">Locked</span>
                                )}
                              </div>
                              {forum.description && (
                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                  {forum.description}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
