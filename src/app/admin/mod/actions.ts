"use server";

import { revalidatePath } from "next/cache";
import { makeServerCaller } from "@/server/api/caller";

export async function resolveReport(input: {
  reportId: string;
  action: "DISMISS" | "SOFT_DELETE_POST" | "SOFT_DELETE_THREAD" | "RESTORE_POST" | "RESTORE_THREAD" | "LOCK_THREAD" | "UNLOCK_THREAD" | "PIN_THREAD" | "UNPIN_THREAD";
  reason: string;
}) {
  try {
    const caller = await makeServerCaller();
    await caller.moderation.resolve(input);
    revalidatePath("/admin/mod");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to resolve report." };
  }
}

export async function runThreadAction(input: {
  threadId: string;
  action: "LOCK" | "UNLOCK" | "PIN" | "UNPIN";
  reason: string;
}) {
  try {
    const caller = await makeServerCaller();
    await caller.moderation.threadAction(input);
    revalidatePath("/admin/threads");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to update thread." };
  }
}

export async function moveThread(input: { threadId: string; forumId: string; reason: string }) {
  try {
    const caller = await makeServerCaller();
    await caller.moderation.moveThread(input);
    revalidatePath("/admin/threads");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to move thread." };
  }
}
