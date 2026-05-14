"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/config";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import type { TrpcContext } from "@/server/api/trpc";

async function createCaller() {
  const session = await auth();
  const ctx: TrpcContext = session?.user
    ? {
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
      }
    : { db, session: null };
  return appRouter.createCaller(ctx);
}

export async function createCategory(input: { name: string; description?: string }) {
  try {
    const caller = await createCaller();
    await caller.category.create(input);
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to create category." };
  }
}

export async function updateCategory(input: {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  isPublic?: boolean;
  sortOrder?: number;
}) {
  try {
    const caller = await createCaller();
    await caller.category.update(input);
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to update category." };
  }
}

export async function softDeleteCategory(id: string) {
  try {
    const caller = await createCaller();
    await caller.category.softDelete({ id });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to delete category." };
  }
}

export async function reorderCategories(items: { id: string; sortOrder: number }[]) {
  try {
    const caller = await createCaller();
    await caller.category.reorder({ items });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to reorder categories." };
  }
}
