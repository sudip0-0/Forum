import { describe, expect, it, vi } from "vitest";
import { appRouter } from "@/server/api/root";
import type { TrpcContext } from "@/server/api/trpc";

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

const memberSession: TrpcContext["session"] = {
  user: { id: "member-1", email: "member@example.com", name: "Member", role: "MEMBER" },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

describe("user router", () => {
  describe("getPublicProfile", () => {
    it("returns public profile without email or passwordHash", async () => {
      const user = {
        id: "u1",
        username: "testuser",
        displayName: "Test",
        image: null,
        bio: "Hello",
        role: "MEMBER",
        reputation: 0,
        createdAt: new Date(),
        badges: [],
      };
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue(user) },
        thread: { findMany: vi.fn().mockResolvedValue([]) },
      };

      const caller = createCaller({ db: db as never, session: null });
      const result = await caller.user.getPublicProfile({ username: "testuser" });

      expect(result.username).toBe("testuser");
      expect(result).not.toHaveProperty("email");
      expect(result).not.toHaveProperty("passwordHash");
      expect(db.thread.findMany).toHaveBeenCalled();
    });

    it("paginates public profile activity", async () => {
      const user = {
        id: "u1",
        username: "testuser",
        displayName: "Test",
        image: null,
        bio: "Hello",
        role: "MEMBER",
        reputation: 3,
        createdAt: new Date(),
        badges: [],
      };
      const threads = Array.from({ length: 3 }, (_, index) => ({
        id: `thread-${index + 1}`,
        title: `Thread ${index + 1}`,
        slug: `thread-${index + 1}`,
        createdAt: new Date(),
        forum: { slug: "general-discussion", name: "General Discussion" },
      }));
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue(user) },
        thread: { findMany: vi.fn().mockResolvedValue(threads) },
      };
      const caller = createCaller({ db: db as never, session: null });

      const result = await caller.user.getPublicProfile({
        username: "testuser",
        cursor: "thread-0",
        limit: 2,
      });

      expect(result.threads.map((thread) => thread.id)).toEqual(["thread-1", "thread-2"]);
      expect(result.nextCursor).toBe("thread-3");
    });

    it("rejects unbounded profile activity limits", async () => {
      const db = { user: { findUnique: vi.fn() } };
      const caller = createCaller({ db: db as never, session: null });

      await expect(
        caller.user.getPublicProfile({ username: "testuser", limit: 500 }),
      ).rejects.toThrow();
      expect(db.user.findUnique).not.toHaveBeenCalled();
    });

    it("returns NOT_FOUND for missing user", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue(null) },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.user.getPublicProfile({ username: "nope" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("updateProfile", () => {
    it("allows user to update own profile", async () => {
      const db = {
        user: { update: vi.fn().mockResolvedValue({}) },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      const result = await caller.user.updateProfile({ displayName: "New Name", bio: "New bio" });

      expect(result.success).toBe(true);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "member-1" },
        data: {
          displayName: "New Name",
          bio: "New bio",
          image: undefined,
          digestFrequency: undefined,
          emailOnReply: undefined,
        },
      });
    });

    it("rejects guest (UNAUTHORIZED)", async () => {
      const db = { user: { update: vi.fn() } };

      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.user.updateProfile({ displayName: "X" })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("rejects profile updates by suspended users", async () => {
      const db = { user: { update: vi.fn() } };
      const suspendedSession = {
        ...memberSession,
        user: { ...memberSession.user, isSuspended: true },
      };

      const caller = createCaller({ db: db as never, session: suspendedSession });
      await expect(caller.user.updateProfile({ displayName: "X" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(db.user.update).not.toHaveBeenCalled();
    });
  });
});
