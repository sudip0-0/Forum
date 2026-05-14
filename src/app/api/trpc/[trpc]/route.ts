import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { auth } from "@/server/auth/config";
import type { TrpcContext } from "@/server/api/trpc";

async function createContext(): Promise<TrpcContext> {
  const session = await auth();
  if (!session?.user) {
    return { db, session: null };
  }
  return {
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
  };
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
