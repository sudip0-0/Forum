"use server";

import { revalidatePath } from "next/cache";
import { makeServerCaller } from "@/server/api/caller";

export async function changeUserRole(input: {
  userId: string;
  role: "MEMBER" | "MODERATOR" | "ADMIN";
}) {
  try {
    const caller = await makeServerCaller();
    await caller.moderation.changeRole(input);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to change role." };
  }
}

export async function toggleSuspension(input: {
  userId: string;
  isSuspended: boolean;
  reason: string;
}) {
  try {
    const caller = await makeServerCaller();
    await caller.moderation.suspendUser({
      userId: input.userId,
      isSuspended: input.isSuspended,
      reason: input.reason,
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to update suspension." };
  }
}
