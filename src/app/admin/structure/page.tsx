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
  const sections = await caller.section.listAll();
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Structure Manager</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage sections, categories, and forums in one place.</p>
      <StructureManager initialSections={sections} />
    </main>
  );
}
