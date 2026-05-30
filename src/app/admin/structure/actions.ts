"use server";

import { revalidatePath } from "next/cache";
import { makeServerCaller } from "@/server/api/caller";

function refresh() {
  revalidatePath("/admin/structure");
  revalidatePath("/forums");
}

export async function createSection(input: { name: string; description?: string }) {
  try { await (await makeServerCaller()).section.create(input); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function updateSection(input: { id: string; name?: string; description?: string; isPublic?: boolean; isLocked?: boolean }) {
  try { await (await makeServerCaller()).section.update(input); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function reorderSections(items: { id: string; sortOrder: number }[]) {
  try { await (await makeServerCaller()).section.reorder({ items }); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function softDeleteSection(id: string) {
  try { await (await makeServerCaller()).section.softDelete({ id }); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function createCategory(input: { sectionId: string; name: string; description?: string }) {
  try { await (await makeServerCaller()).category.create(input); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function updateCategory(input: { id: string; name?: string; description?: string; isPublic?: boolean; isLocked?: boolean; sectionId?: string }) {
  try { await (await makeServerCaller()).category.update(input); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function reorderCategories(items: { id: string; sortOrder: number }[]) {
  try { await (await makeServerCaller()).category.reorder({ items }); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function softDeleteCategory(id: string) {
  try { await (await makeServerCaller()).category.softDelete({ id }); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function createForum(input: { categoryId: string; name: string; description?: string }) {
  try { await (await makeServerCaller()).forum.create(input); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function updateForum(input: { id: string; categoryId?: string; name?: string; description?: string; isPublic?: boolean; isLocked?: boolean }) {
  try { await (await makeServerCaller()).forum.update(input); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function reorderForums(items: { id: string; sortOrder: number }[]) {
  try { await (await makeServerCaller()).forum.reorder({ items }); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function softDeleteForum(id: string) {
  try { await (await makeServerCaller()).forum.softDelete({ id }); refresh(); return { success: true }; }
  catch (error) { return { error: (error as Error).message }; }
}
