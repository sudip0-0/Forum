"use server";

import { revalidatePath } from "next/cache";
import { makeServerCaller } from "@/server/api/caller";

export async function createCategory(input: { name: string; description?: string }) {
  try {
    const caller = await makeServerCaller();
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
    const caller = await makeServerCaller();
    await caller.category.update(input);
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to update category." };
  }
}

export async function softDeleteCategory(id: string) {
  try {
    const caller = await makeServerCaller();
    await caller.category.softDelete({ id });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to delete category." };
  }
}

export async function reorderCategories(items: { id: string; sortOrder: number }[]) {
  try {
    const caller = await makeServerCaller();
    await caller.category.reorder({ items });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to reorder categories." };
  }
}
