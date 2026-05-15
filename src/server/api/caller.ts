import { auth } from "@/server/auth/config";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import type { TrpcContext } from "@/server/api/trpc";

/**
 * Build a server-side tRPC caller with the current session attached.
 * Use this in server actions and server components instead of
 * duplicating the caller setup in each file.
 */
export async function makeServerCaller() {
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
            isSuspended: session.user.isSuspended,
          },
          expires: session.expires,
        },
      }
    : { db, session: null };
  return appRouter.createCaller(ctx);
}
