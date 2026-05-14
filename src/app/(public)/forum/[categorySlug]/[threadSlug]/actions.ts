"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth/config";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import type { TrpcContext } from "@/server/api/trpc";

async function createCaller() {
  const session = await auth();
  const ctx: TrpcContext = session?.user
    ? {
        db,
        session: {
          user: {
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.name ?? null,
            role: session.user.role,
          },
          expires: session.expires,
        },
      }
    : { db, session: null };
  return appRouter.createCaller(ctx);
}

export async function createReply(
  categorySlug: string,
  threadSlug: string,
  input: { threadId: string; parentId?: string; content: string },
) {
  try {
    const caller = await createCaller();
    await caller.post.create(input);
    revalidatePath(`/forum/${categorySlug}/${threadSlug}`);
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to create reply." };
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
    const caller = await createCaller();
    await caller.moderation.report(input);
    revalidatePath(`/forum/${categorySlug}/${threadSlug}`);
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to submit report." };
  }
}
