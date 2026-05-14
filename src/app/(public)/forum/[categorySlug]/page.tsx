import Link from "next/link";
import { notFound } from "next/navigation";
import { appRouter } from "@/server/api/root";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/prisma";

export default async function CategoryThreadListPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const session = await auth();

  const caller = appRouter.createCaller({
    db,
    session: session?.user
      ? {
          user: {
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.name ?? null,
            role: session.user.role,
          },
          expires: session.expires,
        }
      : null,
  });

  let data;
  try {
    data = await caller.thread.listByCategory({ categorySlug });
  } catch {
    notFound();
  }

  const { threads, category } = data;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{category.name}</h1>
          {category.description && (
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
          )}
        </div>
        {session?.user && (
          <Link
            href={`/forum/${categorySlug}/new`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New Thread
          </Link>
        )}
      </div>

      {threads.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No threads yet.</p>
      ) : (
        <ul className="mt-8 divide-y rounded-lg border">
          {threads.map((thread) => (
            <li key={thread.id} className="px-4 py-3">
              <Link
                href={`/forum/${categorySlug}/${thread.slug}`}
                className="block hover:underline"
              >
                <span className="text-sm font-medium">{thread.title}</span>
              </Link>
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                <span>{thread.author.displayName ?? thread.author.username}</span>
                <span>{thread.replyCount} replies</span>
                <span>{new Date(thread.lastActivityAt).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
