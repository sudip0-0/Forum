import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db/prisma";
import { appRouter } from "@/server/api/root";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { TagPill } from "@/components/forum/tag-pill";

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
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Breadcrumbs items={breadcrumbItems} className="mb-4" />

      <h1 className="text-2xl font-semibold">{category.name}</h1>
      {category.description && (
        <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
      )}

      {category.forums.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground">Forums</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {category.forums.map((forum) => (
              <Link
                key={forum.id}
                href={`/forum/${forum.slug}`}
                className="rounded-lg border px-4 py-3 hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium">{forum.name}</p>
                {forum.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{forum.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {threads.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground">Recent Threads</h2>
          <ul className="mt-3 divide-y rounded-lg border">
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
                    <Link
                      href={`/forum/${thread.forum.slug}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {thread.forum.name}
                    </Link>
                  </span>
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
        </div>
      )}
    </main>
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
