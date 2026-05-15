"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { makeServerCaller } from "@/server/api/caller";

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
    return { error: (e as { message?: string }).message ?? "Failed to create thread." };
  }
}
