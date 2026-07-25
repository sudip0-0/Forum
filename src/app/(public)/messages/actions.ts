"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { makeServerCaller } from "@/server/api/caller";

export async function openConversationAction(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const caller = await makeServerCaller();
  const convo = await caller.message.openWithUsername({ username });
  redirect(`/messages/${convo.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const conversationId = String(formData.get("conversationId") ?? "");
  const body = String(formData.get("body") ?? "");
  const caller = await makeServerCaller();
  await caller.message.send({ conversationId, body });
  await caller.message.markRead({ conversationId });
  revalidatePath(`/messages/${conversationId}`);
}
