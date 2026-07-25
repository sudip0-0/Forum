import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "@/server/api/root";
import type { TrpcContext } from "@/server/api/trpc";
import { clearInMemoryRateLimitsForTests } from "@/server/api/rate-limit";

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

const memberSession: TrpcContext["session"] = {
  user: { id: "member-1", email: "member@example.com", name: "Member", role: "MEMBER" },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

const visibleForum = {
  isPublic: true,
  isDeleted: false,
  isLocked: false,
  category: {
    isPublic: true,
    isDeleted: false,
    isLocked: false,
    section: { isPublic: true, isDeleted: false, isLocked: false },
  },
};

describe("post router", () => {
  beforeEach(() => {
    clearInMemoryRateLimitsForTests();
  });

  describe("listByThread", () => {
    it("returns posts excluding deleted", async () => {
      const posts = [{ id: "p1", content: "Hello", parentId: null, createdAt: new Date(), author: { id: "u1", username: "user1", displayName: null } }];
      const db = {
        thread: { findUnique: vi.fn().mockResolvedValue({ id: "t1", isDeleted: false, forum: visibleForum }) },
        post: { findMany: vi.fn().mockResolvedValue(posts) },
      };

      const caller = createCaller({ db: db as never, session: null });
      const result = await caller.post.listByThread({ threadId: "t1" });

      expect(result.posts).toHaveLength(1);
      expect(db.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isDeleted: false }),
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: 51,
        }),
      );
    });

    it("uses cursor pagination without adding conflicting id filters", async () => {
      const db = {
        thread: { findUnique: vi.fn().mockResolvedValue({ id: "t1", isDeleted: false, forum: visibleForum }) },
        post: { findMany: vi.fn().mockResolvedValue([]) },
      };

      const caller = createCaller({ db: db as never, session: null });
      await caller.post.listByThread({ threadId: "t1", cursor: "post-1", limit: 2 });

      expect(db.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { threadId: "t1", isDeleted: false },
          cursor: { id: "post-1" },
          skip: 1,
          take: 3,
        }),
      );
    });

    it("returns next cursor for post pages", async () => {
      const posts = [
        { id: "post-1", content: "First" },
        { id: "post-2", content: "Second" },
        { id: "post-3", content: "Third" },
      ];
      const db = {
        thread: { findUnique: vi.fn().mockResolvedValue({ id: "t1", isDeleted: false, forum: visibleForum }) },
        post: { findMany: vi.fn().mockResolvedValue(posts) },
      };

      const caller = createCaller({ db: db as never, session: null });
      const result = await caller.post.listByThread({ threadId: "t1", limit: 2 });

      expect(result.posts.map((post) => post.id)).toEqual(["post-1", "post-2"]);
      expect(result.nextCursor).toBe("post-3");
    });

    it("rejects unbounded post limits", async () => {
      const db = {
        thread: { findUnique: vi.fn() },
        post: { findMany: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.post.listByThread({ threadId: "t1", limit: 1000 })).rejects.toThrow();
      expect(db.post.findMany).not.toHaveBeenCalled();
    });

    it("rejects posts for hidden threads", async () => {
      const db = {
        thread: {
          findUnique: vi.fn().mockResolvedValue({
            id: "t1",
            isDeleted: false,
            forum: { ...visibleForum, isPublic: false },
          }),
        },
        post: { findMany: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.post.listByThread({ threadId: "t1" })).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      expect(db.post.findMany).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("creates a reply and increments replyCount", async () => {
      const post = { id: "p2", threadId: "t1", content: "Reply", parentId: null };
      const tx = {
        post: { create: vi.fn().mockResolvedValue(post) },
        thread: { update: vi.fn() },
      };
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: {
          findUnique: vi.fn().mockResolvedValue({
            id: "t1",
            isDeleted: false,
            isLocked: false,
            forum: visibleForum,
          }),
        },
        $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      const result = await caller.post.create({ threadId: "t1", content: "Reply" });

      expect(result.id).toBe("p2");
      expect(tx.thread.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ replyCount: { increment: 1 } }) }),
      );
      expect(db.$transaction).toHaveBeenCalled();
    });

    it("rejects when thread is locked", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: { findUnique: vi.fn().mockResolvedValue({ id: "t1", isDeleted: false, isLocked: true, forum: visibleForum }), update: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.create({ threadId: "t1", content: "Reply" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects when thread not found", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.create({ threadId: "t1", content: "Reply" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects when thread is deleted", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: { findUnique: vi.fn().mockResolvedValue({ id: "t1", isDeleted: true, isLocked: false, forum: visibleForum }), update: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.create({ threadId: "t1", content: "Reply" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects guest (UNAUTHORIZED)", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: { findUnique: vi.fn(), update: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.post.create({ threadId: "t1", content: "Reply" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("allows replies that reference earlier messages without nesting limits", async () => {
      const post = { id: "p-new", threadId: "t1", content: "Reply", parentId: "p2" };
      const tx = {
        post: {
          create: vi.fn().mockResolvedValue(post),
          findUnique: vi.fn().mockResolvedValueOnce({ id: "p2", parentId: "p1", threadId: "t1" }),
        },
        thread: { update: vi.fn() },
      };
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: {
          findUnique: vi.fn().mockResolvedValue({
            id: "t1",
            isDeleted: false,
            isLocked: false,
            forum: visibleForum,
          }),
        },
        post: {
          findUnique: vi.fn().mockResolvedValueOnce({ id: "p2", parentId: "p1", threadId: "t1" }),
        },
        $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      const result = await caller.post.create({ threadId: "t1", parentId: "p2", content: "Reply" });
      expect(result.id).toBe("p-new");
    });

    it("rejects empty content", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: { findUnique: vi.fn(), update: vi.fn() },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.create({ threadId: "t1", content: "" })).rejects.toThrow();
    });

    it("rejects replies beneath a locked parent category", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: {
          findUnique: vi.fn().mockResolvedValue({
            id: "t1",
            isDeleted: false,
            isLocked: false,
            forum: {
              ...visibleForum,
              category: { ...visibleForum.category, isLocked: true },
            },
          }),
          update: vi.fn(),
        },
        post: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.create({ threadId: "t1", content: "Reply" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects reply by suspended user", async () => {
      const suspendedSession = { ...memberSession, user: { ...memberSession.user, isSuspended: true } };
      const db = {
        thread: { findUnique: vi.fn() },
        post: { create: vi.fn() },
      };
      const caller = createCaller({ db: db as never, session: suspendedSession });
      await expect(caller.post.create({ threadId: "t1", content: "Reply" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects reply by unverified user", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: null }) },
        thread: { findUnique: vi.fn() },
        post: { create: vi.fn() },
      };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.create({ threadId: "t1", content: "Reply" })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("rejects stale sessions before attempting to create a reply", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue(null) },
        thread: { findUnique: vi.fn() },
        post: { create: vi.fn() },
      };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.create({ threadId: "t1", content: "Reply" })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
      expect(db.post.create).not.toHaveBeenCalled();
    });
  });

  describe("updateOwn", () => {
    const ownReply = {
      id: "reply-1",
      authorId: "member-1",
      threadId: "t1",
      isDeleted: false,
      thread: { id: "t1", ...visibleForum, isDeleted: false, forum: visibleForum },
    };

    it("lets the owner edit a reply", async () => {
      const db = {
        post: {
          findUnique: vi.fn().mockResolvedValue(ownReply),
          findFirst: vi.fn().mockResolvedValue({ id: "original" }),
          update: vi.fn(),
        },
      };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.updateOwn({ postId: "reply-1", content: "Edited reply" })).resolves.toEqual({ success: true });
    });

    it("rejects reply edits by non-owners", async () => {
      const db = { post: { findUnique: vi.fn().mockResolvedValue({ ...ownReply, authorId: "other" }) } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.updateOwn({ postId: "reply-1", content: "Edited reply" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects reply edits by suspended users", async () => {
      const caller = createCaller({ db: {} as never, session: { ...memberSession, user: { ...memberSession.user, isSuspended: true } } });
      await expect(caller.post.updateOwn({ postId: "reply-1", content: "Edited reply" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects edits to deleted replies", async () => {
      const db = { post: { findUnique: vi.fn().mockResolvedValue({ ...ownReply, isDeleted: true }) } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.updateOwn({ postId: "reply-1", content: "Edited reply" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("validates reply edit content", async () => {
      const caller = createCaller({ db: {} as never, session: memberSession });
      await expect(caller.post.updateOwn({ postId: "reply-1", content: "" })).rejects.toThrow();
    });
  });

  describe("deleteOwn", () => {
    const ownReply = {
      id: "reply-1",
      authorId: "member-1",
      threadId: "t1",
      isDeleted: false,
      thread: { id: "t1", ...visibleForum, isDeleted: false, forum: visibleForum },
    };

    it("soft-deletes an owned reply and decrements reply count", async () => {
      const db = {
        post: {
          findUnique: vi.fn().mockResolvedValue(ownReply),
          findFirst: vi.fn().mockResolvedValue({ id: "original" }),
          update: vi.fn(),
        },
        thread: { update: vi.fn() },
        $transaction: vi.fn().mockResolvedValue([]),
      };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.deleteOwn({ postId: "reply-1" })).resolves.toEqual({ success: true });
      expect(db.post.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isDeleted: true } }));
      expect(db.thread.update).toHaveBeenCalledWith(expect.objectContaining({ data: { replyCount: { decrement: 1 } } }));
    });

    it("rejects reply deletion by non-owners", async () => {
      const db = { post: { findUnique: vi.fn().mockResolvedValue({ ...ownReply, authorId: "other" }) } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.post.deleteOwn({ postId: "reply-1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects reply deletion by suspended users", async () => {
      const caller = createCaller({ db: {} as never, session: { ...memberSession, user: { ...memberSession.user, isSuspended: true } } });
      await expect(caller.post.deleteOwn({ postId: "reply-1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });
});
