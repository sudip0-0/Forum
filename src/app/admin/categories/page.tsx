import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";
import { isAdmin } from "@/server/auth/permissions";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { AdminCategoryList } from "./client";

export default async function AdminCategoriesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!isAdmin(session.user.role)) {
    redirect("/");
  }

  const caller = appRouter.createCaller({
    db,
    session: {
      user: {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? null,
        role: session.user.role,
      },
      expires: session.expires,
    },
  });

  const categories = await caller.category.listAll();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Manage Categories</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create, edit, reorder, and hide categories.
      </p>
      <AdminCategoryList categories={categories} />
    </main>
  );
}
