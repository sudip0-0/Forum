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

describe("thread router", () => {
  describe("listByCategory", () => {
    it("returns threads for a public category", async () => {
      const threads = [{ id: "t1", title: "Hello", slug: "hello", replyCount: 0, lastActivityAt: new Date(), author: { id: "u1", username: "user1", displayName: null } }];
      const db = {
        category: { findUnique: vi.fn().mockResolvedValue({ id: "cat-1", slug: "general", isPublic: true }) },
        thread: { findMany: vi.fn().mockResolvedValue(threads) },
      };

      const caller = createCaller({ db: db as never, session: null });
      const result = await caller.thread.listByCategory({ categorySlug: "general" });

      expect(result.threads).toHaveLength(1);
      expect(result.category.slug).toBe("general");
      expect(db.thread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isDeleted: false }) }),
      );
    });

    it("returns NOT_FOUND for non-public category", async () => {
      const db = {
        category: { findUnique: vi.fn().mockResolvedValue({ id: "cat-1", slug: "hidden", isPublic: false }) },
        thread: { findMany: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.thread.listByCategory({ categorySlug: "hidden" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("returns NOT_FOUND for missing category", async () => {
      const db = {
        category: { findUnique: vi.fn().mockResolvedValue(null) },
        thread: { findMany: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.thread.listByCategory({ categorySlug: "nope" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("getBySlug", () => {
    it("returns thread with author info", async () => {
      const thread = { id: "t1", slug: "hello", isDeleted: false, author: { id: "u1", username: "user1", displayName: null }, category: { id: "c1", name: "General", slug: "general" } };
      const db = {
        thread: { findUnique: vi.fn().mockResolvedValue(thread) },
      };

      const caller = createCaller({ db: db as never, session: null });
      const result = await caller.thread.getBySlug({ slug: "hello" });
      expect(result.slug).toBe("hello");
    });

    it("returns NOT_FOUND for deleted thread", async () => {
      const db = {
        thread: { findUnique: vi.fn().mockResolvedValue({ id: "t1", slug: "hello", isDeleted: true }) },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.thread.getBySlug({ slug: "hello" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("create", () => {
    it("creates thread and first post in transaction", async () => {
      const thread = { id: "t1", slug: "my-thread", title: "My Thread" };
      const db = {
        category: { findUnique: vi.fn().mockResolvedValue({ id: "cat-1", isLocked: false }) },
        thread: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue(thread) },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      const result = await caller.thread.create({
        categoryId: "cat-1",
        title: "My Thread",
        content: "This is the content of my thread.",
      });

      expect(result.slug).toBe("my-thread");
      expect(db.thread.create).toHaveBeenCalled();
      expect(db.post.create).toHaveBeenCalled();
    });

    it("appends suffix on slug collision", async () => {
      const thread = { id: "t1", slug: "my-thread-abc", title: "My Thread" };
      const db = {
        category: { findUnique: vi.fn().mockResolvedValue({ id: "cat-1", isLocked: false }) },
        thread: { findUnique: vi.fn().mockResolvedValue({ id: "existing" }), create: vi.fn().mockResolvedValue(thread) },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      const result = await caller.thread.create({
        categoryId: "cat-1",
        title: "My Thread",
        content: "This is the content of my thread.",
      });

      expect(result.slug).toContain("my-thread");
    });

    it("rejects when category is locked", async () => {
      const db = {
        category: { findUnique: vi.fn().mockResolvedValue({ id: "cat-1", isLocked: true }) },
        thread: { findUnique: vi.fn(), create: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.thread.create({ categoryId: "cat-1", title: "My Thread", content: "Some content here." }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects when category not found", async () => {
      const db = {
        category: { findUnique: vi.fn().mockResolvedValue(null) },
        thread: { findUnique: vi.fn(), create: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.thread.create({ categoryId: "nope", title: "My Thread", content: "Some content here." }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects guest (UNAUTHORIZED)", async () => {
      const db = {
        category: { findUnique: vi.fn() },
        thread: { findUnique: vi.fn(), create: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(
        caller.thread.create({ categoryId: "cat-1", title: "My Thread", content: "Some content here." }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("rejects short title", async () => {
      const db = {
        category: { findUnique: vi.fn() },
        thread: { findUnique: vi.fn(), create: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.thread.create({ categoryId: "cat-1", title: "Hi", content: "Some content here." }),
      ).rejects.toThrow();
    });

    it("rejects short content", async () => {
      const db = {
        category: { findUnique: vi.fn() },
        thread: { findUnique: vi.fn(), create: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.thread.create({ categoryId: "cat-1", title: "Valid Title", content: "Short" }),
      ).rejects.toThrow();
    });
  });
});
