"use server";

import { redirect } from "next/navigation";
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
  return { caller: appRouter.createCaller(ctx), session };
}

export async function createThread(
  categorySlug: string,
  categoryId: string,
  input: { title: string; content: string },
) {
  const { caller } = await createCaller();
  try {
    const thread = await caller.thread.create({
      categoryId,
      title: input.title,
      content: input.content,
    });
    revalidatePath(`/forum/${categorySlug}`);
    redirect(`/forum/${categorySlug}/${thread.slug}`);
  } catch (e: unknown) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { error: (e as { message?: string }).message ?? "Failed to create thread." };
  }
}
