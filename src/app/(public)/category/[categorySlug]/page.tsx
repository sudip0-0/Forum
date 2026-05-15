import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db/prisma";
import { appRouter } from "@/server/api/root";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { TagPill } from "@/components/forum/tag-pill";
import { MessageSquare, ArrowRight } from "lucide-react";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;

  const caller = appRouter.createCaller({ db, session: null });

  let category;
  try {
    category = await caller.category.getBySlug({ slug: categorySlug });
  } catch {
    notFound();
  }

  const { threads } = await caller.thread.listByCategory({ categorySlug, limit: 10 });

  const breadcrumbItems = [
    { label: "Forums", href: "/forums" },
    { label: category.section.name },
    { label: category.name },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      <div className="page-header">
        <h1 className="heading-xl">{category.name}</h1>
        {category.description && (
          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
        )}
      </div>

      {category.forums.length > 0 && (
        <div className="mb-8">
          <div className="section-panel-header rounded-t-md text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Forums in this category
          </div>
          <div className="section-panel">
            <div className="divide-y divide-border">
              {category.forums.map((forum) => (
                <Link
                  key={forum.id}
                  href={`/forum/${forum.slug}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40 hover:no-underline"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-border bg-background shadow-[1px_1px_0px_var(--border)]">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold">{forum.name}</span>
                    {forum.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {forum.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {threads.length > 0 && (
        <div>
          <div className="section-panel-header rounded-t-md text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Recent Threads
          </div>
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
        </div>
      )}

      {threads.length === 0 && category.forums.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <MessageSquare className="h-10 w-10" />
          </div>
          <p className="empty-state-title">No content yet</p>
          <p className="empty-state-text">
            This category doesn&apos;t have any forums or threads yet.
          </p>
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const caller = appRouter.createCaller({ db, session: null });
  try {
    const category = await caller.category.getBySlug({ slug: categorySlug });
    return { title: `${category.name} - Forums` };
  } catch {
    return { title: "Category not found" };
  }
}
