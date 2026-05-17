"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { makeServerCaller } from "@/server/api/caller";

function friendlyCreateThreadError(error: unknown) {
  const message = (error as { message?: string }).message ?? "";
  if (message.includes("UNAUTHORIZED")) return "Log in to start a thread.";
  if (message.includes("Verify your email")) return "Verify your email before starting a thread. You can request a new verification email if the link expired.";
  if (message.includes("suspended")) return "Your account is suspended, so you cannot start a thread.";
  if (message.includes("Posting is locked")) return "Posting is currently locked in this forum.";
  if (message.includes("Forum not found")) return "This forum is no longer available.";
  return "Failed to create thread.";
}

export async function createThread(
  categorySlug: string,
  forumId: string,
  input: { title: string; content: string; tags: string[] },
) {
  const caller = await makeServerCaller();
  try {
    const thread = await caller.thread.create({
      forumId,
      title: input.title,
      content: input.content,
      tags: input.tags,
    });
    revalidatePath(`/forum/${categorySlug}`);
    redirect(`/forum/${categorySlug}/${thread.slug}`);
  } catch (e: unknown) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { error: friendlyCreateThreadError(e) };
  }
}
