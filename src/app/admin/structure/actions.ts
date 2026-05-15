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

export async function createSection(input: { name: string; description?: string }) {
  try {
    await (await caller()).section.create(input);
    revalidatePath("/admin/structure");
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function createCategory(input: { sectionId: string; name: string; description?: string }) {
  try {
    await (await caller()).category.create(input);
    revalidatePath("/admin/structure");
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function createForum(input: { categoryId: string; name: string; description?: string }) {
  try {
    await (await caller()).forum.create(input);
    revalidatePath("/admin/structure");
  } catch (error) {
    return { error: (error as Error).message };
  }
}
