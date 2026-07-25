import { describe, expect, it } from "vitest";
import { appRouter } from "@/server/api/root";
import type { TrpcContext } from "@/server/api/trpc";

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

const mockSession: TrpcContext["session"] = {
  user: {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    role: "MEMBER",
  },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

describe("health router", () => {
  it("returns ok for public query when db is healthy", async () => {
    const db = {
      $queryRaw: async () => [{ "?column?": 1 }],
    };
    const caller = createCaller({ db: db as never, session: null });
    const result = await caller.health.health();
    expect(result.status).toBe("ok");
    expect(result.db).toBe("ok");
    expect(result.timestamp).toBeDefined();
  });

  it("reports degraded when db probe fails", async () => {
    const db = {
      $queryRaw: async () => {
        throw new Error("db down");
      },
    };
    const caller = createCaller({ db: db as never, session: null });
    const result = await caller.health.health();
    expect(result.status).toBe("degraded");
    expect(result.db).toBe("error");
  });

  it("returns authed info for protected query with session without email", async () => {
    const caller = createCaller({ db: {} as never, session: mockSession });
    const result = await caller.health.authCheck();
    expect(result.authenticated).toBe(true);
    expect(result.userId).toBe("user-1");
    expect(result.role).toBe("MEMBER");
    expect(result).not.toHaveProperty("email");
  });

  it("throws UNAUTHORIZED for protected query without session", async () => {
    const caller = createCaller({ db: {} as never, session: null });
    await expect(caller.health.authCheck()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
