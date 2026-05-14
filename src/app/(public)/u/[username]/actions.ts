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

export async function updateProfile(
  username: string,
  input: { displayName?: string; bio?: string },
) {
  try {
    const caller = await createCaller();
    await caller.user.updateProfile(input);
    revalidatePath(`/u/${username}`);
    return { success: true };
  } catch (e: unknown) {
    return { error: (e as { message?: string }).message ?? "Failed to update profile." };
  }
}
