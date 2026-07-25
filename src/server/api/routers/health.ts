import { publicProcedure, protectedProcedure, router } from "@/server/api/trpc";
import { getEnv } from "@/server/env";

type ProbeStatus = "ok" | "error" | "skipped";

async function probeDatabase(db: {
  $queryRaw: (query: TemplateStringsArray) => Promise<unknown>;
}): Promise<ProbeStatus> {
  try {
    await db.$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "error";
  }
}

async function probeRedis(): Promise<ProbeStatus> {
  const env = getEnv();
  if (
    !env.REDIS_URL ||
    env.RATE_LIMIT_BACKEND === "memory" ||
    (env.NODE_ENV === "test" && env.RUN_INTEGRATION !== "1")
  ) {
    return "skipped";
  }

  try {
    const { createClient } = await import("redis");
    const client = createClient({
      url: env.REDIS_URL,
      socket: { connectTimeout: 500, reconnectStrategy: false },
    });
    client.on("error", () => {
      // Probe failures are returned as status, not logged here.
    });
    await client.connect();
    const pong = await client.ping();
    await client.quit();
    return pong === "PONG" ? "ok" : "error";
  } catch {
    return "error";
  }
}

export const healthRouter = router({
  health: publicProcedure.query(async ({ ctx }) => {
    const [dbStatus, redisStatus] = await Promise.all([
      probeDatabase(ctx.db),
      probeRedis(),
    ]);

    const status =
      dbStatus === "error" || redisStatus === "error" ? "degraded" : "ok";

    return {
      status,
      db: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    };
  }),

  authCheck: protectedProcedure.query(({ ctx }) => {
    return {
      authenticated: true,
      userId: ctx.session.user.id,
      role: ctx.session.user.role,
    };
  }),
});
