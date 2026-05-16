"use server";

import { revalidatePath } from "next/cache";
import { makeServerCaller } from "@/server/api/caller";

function friendlyActionError(error: unknown, fallback: string) {
  const message = (error as { message?: string }).message ?? "";
  if (message.includes("Your session has expired")) return message;
  if (message.includes("UNAUTHORIZED")) return "Please sign in again to continue.";
  if (message.includes("Foreign key constraint")) return "We could not post your reply because your session is no longer valid. Please sign in again.";
  if (message.includes("Thread is locked")) return "This thread is locked and is no longer accepting replies.";
  if (message.includes("Posting is locked")) return "Posting is currently locked in this forum.";
  if (message.includes("Invalid parent post")) return "The message you replied to is no longer available.";
  if (message.includes("Maximum reply depth")) return "Replies cannot be nested more than 3 levels deep.";
  if (message.includes("only edit your own")) return "You do not have permission to edit this content.";
  if (message.includes("only delete your own")) return "You do not have permission to delete this content.";
  if (message.includes("Threads with replies")) return "Threads with replies cannot be deleted by their author.";
  if (message.includes("not found")) return "This content is no longer available.";
  return fallback;
}

export async function createReply(
  categorySlug: string,
  threadSlug: string,
  input: { threadId: string; parentId?: string; content: string },
) {
  try {
    const caller = await makeServerCaller();
    await caller.post.create(input);
    revalidatePath(`/forum/${categorySlug}/${threadSlug}`);
    return { success: true };
  } catch (e: unknown) {
    return { error: friendlyActionError(e, "We could not post your reply. Please try again.") };
  }
}

export async function toggleReaction(
  targetType: "post" | "thread",
  targetId: string,
  emoji: "LIKE" | "HELPFUL" | "LAUGH" | "INSIGHTFUL",
) {
  const caller = await makeServerCaller();
  try {
    return await caller.reaction.toggle(
      targetType === "post" ? { postId: targetId, emoji } : { threadId: targetId, emoji },
    );
  } catch {
    return null;
  }
}

export async function reportContent(
  categorySlug: string,
  threadSlug: string,
  input: {
    postId?: string;
    threadId?: string;
    reason: "SPAM" | "HARASSMENT" | "OFF_TOPIC" | "DUPLICATE" | "OTHER";
    note?: string;
  },
) {
  try {
    const caller = await makeServerCaller();
    await caller.moderation.report(input);
    revalidatePath(`/forum/${categorySlug}/${threadSlug}`);
    return { success: true };
  } catch (e: unknown) {
    return { error: friendlyActionError(e, "We could not submit your report. Please try again.") };
  }
}

export async function updateOwnThread(
  categorySlug: string,
  threadSlug: string,
  input: { threadId: string; title: string; content: string },
) {
  try {
    const caller = await makeServerCaller();
    await caller.thread.updateOwn(input);
    revalidatePath(`/forum/${categorySlug}/${threadSlug}`);
    return { success: true };
  } catch (e: unknown) {
    return { error: friendlyActionError(e, "We could not update your thread. Please try again.") };
  }
}

export async function deleteOwnThread(
  categorySlug: string,
  threadSlug: string,
  input: { threadId: string },
) {
  try {
    const caller = await makeServerCaller();
    await caller.thread.deleteOwn(input);
    revalidatePath(`/forum/${categorySlug}/${threadSlug}`);
    revalidatePath(`/forum/${categorySlug}`);
    return { success: true };
  } catch (e: unknown) {
    return { error: friendlyActionError(e, "We could not delete your thread. Please try again.") };
  }
}

export async function updateOwnReply(
  categorySlug: string,
  threadSlug: string,
  input: { postId: string; content: string },
) {
  try {
    const caller = await makeServerCaller();
    await caller.post.updateOwn(input);
    revalidatePath(`/forum/${categorySlug}/${threadSlug}`);
    return { success: true };
  } catch (e: unknown) {
    return { error: friendlyActionError(e, "We could not update your reply. Please try again.") };
  }
}

export async function deleteOwnReply(
  categorySlug: string,
  threadSlug: string,
  input: { postId: string },
) {
  try {
    const caller = await makeServerCaller();
    await caller.post.deleteOwn(input);
    revalidatePath(`/forum/${categorySlug}/${threadSlug}`);
    return { success: true };
  } catch (e: unknown) {
    return { error: friendlyActionError(e, "We could not delete your reply. Please try again.") };
  }
}
