import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { auth } from "@/server/auth/config";
import type { TrpcContext } from "@/server/api/trpc";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

async function createContext(req: Request): Promise<TrpcContext> {
  const session = await auth();
  const clientIp = getClientIp(req);
  if (!session?.user) {
    return { db, session: null, clientIp };
  }
  return {
    db,
    clientIp,
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
  };
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
  });

export { handler as GET, handler as POST };
