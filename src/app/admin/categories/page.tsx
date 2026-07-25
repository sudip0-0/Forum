import { requireAdmin } from "@/server/auth/guards";
import { makeServerCaller } from "@/server/api/caller";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminCategoryList } from "./client";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const caller = await makeServerCaller();
  const categories = await caller.category.listAll();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <AdminHeader title="Manage Categories" description="Create, edit, reorder, and hide categories." backHref="/admin" />
      <AdminCategoryList categories={categories} />
    </main>
  );
}
