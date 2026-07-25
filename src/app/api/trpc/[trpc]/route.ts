import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { db } from "@/server/db/prisma";
import { auth } from "@/server/auth/config";
import { getClientIpFromHeaders } from "@/server/http/client-ip";
import { createRequestLogger } from "@/server/observability/logger";
import type { TrpcContext } from "@/server/api/trpc";

async function createContext(req: Request): Promise<TrpcContext> {
  const session = await auth();
  const clientIp = getClientIpFromHeaders(req.headers);
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

const handler = (req: Request) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const log = createRequestLogger({ requestId, route: "/api/trpc" });

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError({ error, path, type }) {
      log.error(
        {
          path,
          type,
          code: error.code,
          message: error.message,
        },
        "tRPC error",
      );
    },
  });
};

export { handler as GET, handler as POST };
