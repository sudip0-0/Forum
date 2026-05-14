import Link from "next/link";
import { appRouter } from "@/server/api/root";
import { auth } from "@/server/auth/config";
import { db } from "@/server/db/prisma";

export default async function ForumsPage() {
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

  const categories = await caller.category.listPublic();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Forums</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse public discussion categories.
      </p>

      {categories.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No categories available yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/forum/${cat.slug}`}
              className="block rounded-lg border px-4 py-3 transition-colors hover:bg-accent/50"
            >
              <h2 className="text-sm font-medium">{cat.name}</h2>
              {cat.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {cat.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
