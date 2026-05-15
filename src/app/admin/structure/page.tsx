import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { isAdmin } from "@/server/auth/permissions";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { StructureManager } from "./client";

export default async function AdminStructurePage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!isAdmin(session.user.role)) redirect("/");
  const caller = appRouter.createCaller({
    db,
    session: { user: { id: session.user.id, email: session.user.email ?? "", name: session.user.name ?? null, role: session.user.role }, expires: session.expires },
  });
  const [sections, tree] = await Promise.all([caller.section.listAll(), caller.section.listPublicTree()]);
  const categories = tree.flatMap((section) => section.categories.map((category) => ({ id: category.id, name: `${section.name} / ${category.name}` })));
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Manage Structure</h1>
      <p className="mt-1 text-sm text-muted-foreground">Create sections, categories, and forums.</p>
      <StructureManager sections={sections} categories={categories} />
      <div className="mt-8 space-y-6">
        {tree.map((section) => (
          <section key={section.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{section.name}</h2>
            <div className="mt-4 space-y-3">
              {section.categories.map((category) => (
                <div key={category.id}>
                  <div className="text-sm font-medium">{category.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {category.forums.map((forum) => <span key={forum.id} className="rounded bg-muted px-2 py-1 text-xs">{forum.name}</span>)}
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
