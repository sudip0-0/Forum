"use server";

import { revalidatePath } from "next/cache";
import { makeServerCaller } from "@/server/api/caller";

export async function updateProfile(
  username: string,
  input: { displayName?: string; bio?: string; image?: string },
) {
  try {
    const caller = await makeServerCaller();
    await caller.user.updateProfile(input);
    revalidatePath(`/u/${username}`);
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to update profile." };
  }
}
