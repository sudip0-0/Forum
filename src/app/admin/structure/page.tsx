import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { isAdmin } from "@/server/auth/permissions";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { AdminHeader } from "@/components/admin/admin-header";
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
      <AdminHeader title="Structure Manager" description="Manage sections, categories, and forums in one place." backHref="/admin" />
      <StructureManager initialSections={sections} />
    </main>
  );
}
