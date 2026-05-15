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

describe("post router", () => {
  describe("listByThread", () => {
    it("returns posts excluding deleted", async () => {
      const posts = [{ id: "p1", content: "Hello", parentId: null, createdAt: new Date(), author: { id: "u1", username: "user1", displayName: null } }];
      const db = {
        post: { findMany: vi.fn().mockResolvedValue(posts) },
      };

      const caller = createCaller({ db: db as never, session: null });
      const result = await caller.post.listByThread({ threadId: "t1" });

      expect(result.posts).toHaveLength(1);
      expect(db.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isDeleted: false }) }),
      );
    });
  });

  describe("create", () => {
    it("creates a reply and increments replyCount", async () => {
      const post = { id: "p2", threadId: "t1", content: "Reply", parentId: null };
      const db = {
        thread: { findUnique: vi.fn().mockResolvedValue({ id: "t1", isDeleted: false, isLocked: false }), update: vi.fn() },
        post: { create: vi.fn().mockResolvedValue(post) },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      const result = await caller.post.create({ threadId: "t1", content: "Reply" });

      expect(result.id).toBe("p2");
      expect(db.thread.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ replyCount: { increment: 1 } }) }),
      );
    });

    it("rejects when thread is locked", async () => {
      const db = {
        thread: { findUnique: vi.fn().mockResolvedValue({ id: "t1", isDeleted: false, isLocked: true }), update: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.create({ threadId: "t1", content: "Reply" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects when thread not found", async () => {
      const db = {
        thread: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.create({ threadId: "t1", content: "Reply" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects when thread is deleted", async () => {
      const db = {
        thread: { findUnique: vi.fn().mockResolvedValue({ id: "t1", isDeleted: true, isLocked: false }), update: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.create({ threadId: "t1", content: "Reply" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects guest (UNAUTHORIZED)", async () => {
      const db = {
        thread: { findUnique: vi.fn(), update: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.post.create({ threadId: "t1", content: "Reply" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("allows replies that reference earlier messages without nesting limits", async () => {
      const post = { id: "p-new", threadId: "t1", content: "Reply", parentId: "p2" };
      const db = {
        thread: { findUnique: vi.fn().mockResolvedValue({ id: "t1", isDeleted: false, isLocked: false }), update: vi.fn() },
        post: {
          create: vi.fn().mockResolvedValue(post),
          findUnique: vi.fn().mockResolvedValueOnce({ id: "p2", parentId: "p1", threadId: "t1" }),
        },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      const result = await caller.post.create({ threadId: "t1", parentId: "p2", content: "Reply" });
      expect(result.id).toBe("p-new");
    });

    it("rejects empty content", async () => {
      const db = {
        thread: { findUnique: vi.fn(), update: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.create({ threadId: "t1", content: "" })).rejects.toThrow();
    });
  });
});
