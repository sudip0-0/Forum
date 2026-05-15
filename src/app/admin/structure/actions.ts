"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/config";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";

async function caller() {
  const session = await auth();
  return appRouter.createCaller({
    db,
    session: session?.user
      ? { user: { id: session.user.id, email: session.user.email ?? "", name: session.user.name ?? null, role: session.user.role }, expires: session.expires }
      : null,
  });
}

function refresh() {
  revalidatePath("/admin/structure");
  revalidatePath("/forums");
}

export async function createSection(input: { name: string; description?: string }) {
  try { await (await caller()).section.create(input); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function updateSection(input: { id: string; name?: string; description?: string; isPublic?: boolean; isLocked?: boolean }) {
  try { await (await caller()).section.update(input); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function reorderSections(items: { id: string; sortOrder: number }[]) {
  try { await (await caller()).section.reorder({ items }); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function createCategory(input: { sectionId: string; name: string; description?: string }) {
  try { await (await caller()).category.create(input); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function updateCategory(input: { id: string; name?: string; description?: string; isPublic?: boolean; isLocked?: boolean; sectionId?: string }) {
  try { await (await caller()).category.update(input); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function reorderCategories(items: { id: string; sortOrder: number }[]) {
  try { await (await caller()).category.reorder({ items }); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function createForum(input: { categoryId: string; name: string; description?: string }) {
  try { await (await caller()).forum.create(input); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function updateForum(input: { id: string; categoryId?: string; name?: string; description?: string; isPublic?: boolean; isLocked?: boolean }) {
  try { await (await caller()).forum.update(input); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function reorderForums(items: { id: string; sortOrder: number }[]) {
  try { await (await caller()).forum.reorder({ items }); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
