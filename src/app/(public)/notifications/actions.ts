"use server";

import { revalidatePath } from "next/cache";
import { makeServerCaller } from "@/server/api/caller";

export async function markAllNotificationsRead() {
  const caller = await makeServerCaller();
  await caller.notification.markAllRead();
  revalidatePath("/notifications");
}
