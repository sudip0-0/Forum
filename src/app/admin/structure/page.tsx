import { requireAdmin } from "@/server/auth/guards";
import { makeServerCaller } from "@/server/api/caller";
import { AdminHeader } from "@/components/admin/admin-header";
import { StructureManager } from "./client";

export default async function AdminStructurePage() {
  await requireAdmin();
  const caller = await makeServerCaller();
  const sections = await caller.section.listAll();
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <AdminHeader title="Structure Manager" description="Manage sections, categories, and forums in one place." backHref="/admin" />
      <StructureManager initialSections={sections} />
    </main>
  );
}
