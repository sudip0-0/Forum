import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "@/server/api/root";
import type { TrpcContext } from "@/server/api/trpc";
import { clearInMemoryRateLimitsForTests, RL_CREATE_THREAD } from "@/server/api/rate-limit";

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

const memberSession: TrpcContext["session"] = {
  user: { id: "member-1", email: "member@example.com", name: "Member", role: "MEMBER" },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

const publicForum = {
  id: "forum-1",
  slug: "general-discussion",
  isPublic: true,
  isLocked: false,
  category: { isPublic: true, isLocked: false, section: { isPublic: true, isLocked: false } },
};

describe("thread router", () => {
  beforeEach(() => {
    clearInMemoryRateLimitsForTests();
  });

  it("returns threads for a public forum", async () => {
    const db = {
      forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
      thread: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const caller = createCaller({ db: db as never, session: null });
    const result = await caller.thread.listByForum({ forumSlug: "general-discussion" });
    expect(result.forum.slug).toBe("general-discussion");
    expect(db.thread.findMany).toHaveBeenCalled();
  });

  it("returns first page with bounded limit, next cursor, and deterministic ordering", async () => {
    const rows = [
      { id: "thread-1", lastActivityAt: new Date(), author: {}, tags: [], _count: { reactions: 0 } },
      { id: "thread-2", lastActivityAt: new Date(), author: {}, tags: [], _count: { reactions: 0 } },
      { id: "thread-3", lastActivityAt: new Date(), author: {}, tags: [], _count: { reactions: 0 } },
    ];
    const db = {
      forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
      thread: { findMany: vi.fn().mockResolvedValue(rows) },
    };
    const caller = createCaller({ db: db as never, session: null });

    const result = await caller.thread.listByForum({ forumSlug: "general-discussion", limit: 2 });

    expect(result.threads.map((thread) => thread.id)).toEqual(["thread-1", "thread-2"]);
    expect(result.nextCursor).toBe("thread-3");
    expect(db.thread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        orderBy: [{ isPinned: "desc" }, { lastActivityAt: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("uses cursor pagination for the next forum page", async () => {
    const db = {
      forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
      thread: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const caller = createCaller({ db: db as never, session: null });

    await caller.thread.listByForum({ forumSlug: "general-discussion", cursor: "thread-3", limit: 2 });

    expect(db.thread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "thread-3" },
        skip: 1,
        take: 3,
      }),
    );
  });

  it("rejects unbounded forum list limits", async () => {
    const db = {
      forum: { findUnique: vi.fn() },
      thread: { findMany: vi.fn() },
    };
    const caller = createCaller({ db: db as never, session: null });

    await expect(
      caller.thread.listByForum({ forumSlug: "general-discussion", limit: 1000 }),
    ).rejects.toThrow();
    expect(db.thread.findMany).not.toHaveBeenCalled();
  });

  it("rejects hidden forums", async () => {
    const db = {
      forum: { findUnique: vi.fn().mockResolvedValue({ ...publicForum, isPublic: false }) },
      thread: { findMany: vi.fn() },
    };
    const caller = createCaller({ db: db as never, session: null });
    await expect(caller.thread.listByForum({ forumSlug: "hidden" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns a visible thread", async () => {
    const db = {
      thread: {
        findUnique: vi.fn().mockResolvedValue({
          id: "thread-1",
          slug: "hello",
          isDeleted: false,
          forum: publicForum,
        }),
      },
    };
    const caller = createCaller({ db: db as never, session: null });
    await expect(caller.thread.getBySlug({ slug: "hello" })).resolves.toMatchObject({ slug: "hello" });
  });

  it("creates a thread and first post in a forum", async () => {
    const thread = { id: "thread-1", slug: "my-thread" };
    const tx = { thread: { create: vi.fn().mockResolvedValue(thread) }, post: { create: vi.fn() } };
    const db = {
      user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
      forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
      thread: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn().mockImplementation((fn) => fn(tx)),
    };
    const caller = createCaller({ db: db as never, session: memberSession });
    const result = await caller.thread.create({
      forumId: "forum-1",
      title: "My Thread",
      content: "This is the content of my thread.",
    });
    expect(result.slug).toBe("my-thread");
    expect(tx.thread.create).toHaveBeenCalled();
    expect(tx.post.create).toHaveBeenCalled();
  });

  it("blocks repeated thread creation after the configured window limit", async () => {
    const thread = { id: "thread-1", slug: "my-thread" };
    const tx = { thread: { create: vi.fn().mockResolvedValue(thread) }, post: { create: vi.fn() } };
    const db = {
      user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
      forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
      thread: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn().mockImplementation((fn) => fn(tx)),
    };
    const caller = createCaller({ db: db as never, session: memberSession });

    for (let i = 0; i < RL_CREATE_THREAD.maxRequests; i++) {
      await caller.thread.create({
        forumId: "forum-1",
        title: `My Thread ${i}`,
        content: "This is the content of my thread.",
      });
    }

    await expect(
      caller.thread.create({
        forumId: "forum-1",
        title: "Blocked Thread",
        content: "This is the content of my blocked thread.",
      }),
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      message: expect.stringContaining("Try again"),
    });
  });

  it("rejects locked forums", async () => {
    const db = {
      user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
      forum: { findUnique: vi.fn().mockResolvedValue({ ...publicForum, isLocked: true }) },
      thread: { findUnique: vi.fn() },
    };
    const caller = createCaller({ db: db as never, session: memberSession });
    await expect(
      caller.thread.create({ forumId: "forum-1", title: "My Thread", content: "Some content here." }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects thread creation beneath a locked parent section", async () => {
    const db = {
      user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
      forum: {
        findUnique: vi.fn().mockResolvedValue({
          ...publicForum,
          category: {
            ...publicForum.category,
            section: { ...publicForum.category.section, isLocked: true },
          },
        }),
      },
      thread: { findUnique: vi.fn() },
    };
    const caller = createCaller({ db: db as never, session: memberSession });
    await expect(
      caller.thread.create({ forumId: "forum-1", title: "My Thread", content: "Some content here." }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects thread creation by suspended user", async () => {
    const suspendedSession = { ...memberSession, user: { ...memberSession.user, isSuspended: true } };
    const db = {
      forum: { findUnique: vi.fn() },
      thread: { findUnique: vi.fn() },
    };
    const caller = createCaller({ db: db as never, session: suspendedSession });
    await expect(
      caller.thread.create({ forumId: "forum-1", title: "My Thread", content: "Some content here." }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects thread creation by unverified user", async () => {
    const db = {
      user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: null }) },
      forum: { findUnique: vi.fn() },
      thread: { findUnique: vi.fn() },
    };
    const caller = createCaller({ db: db as never, session: memberSession });
    await expect(
      caller.thread.create({ forumId: "forum-1", title: "My Thread", content: "Some content here." }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  describe("listByForum filters", () => {
    it("filters by pinnedOnly", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
        thread: { findMany: vi.fn().mockResolvedValue([]) },
      };
      const caller = createCaller({ db: db as never, session: null });
      await caller.thread.listByForum({ forumSlug: "general-discussion", pinnedOnly: true });
      expect(db.thread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isPinned: true }) }),
      );
    });

    it("filters by tagSlug", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
        thread: { findMany: vi.fn().mockResolvedValue([]) },
      };
      const caller = createCaller({ db: db as never, session: null });
      await caller.thread.listByForum({ forumSlug: "general-discussion", tagSlug: "help" });
      expect(db.thread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tags: { some: { slug: "help" } } }) }),
      );
    });

    it("filters by authorUsername", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
        thread: { findMany: vi.fn().mockResolvedValue([]) },
      };
      const caller = createCaller({ db: db as never, session: null });
      await caller.thread.listByForum({ forumSlug: "general-discussion", authorUsername: "john" });
      expect(db.thread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ author: { username: "john" } }) }),
      );
    });

    it("filters by updatedWithinDays", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
        thread: { findMany: vi.fn().mockResolvedValue([]) },
      };
      const caller = createCaller({ db: db as never, session: null });
      await caller.thread.listByForum({ forumSlug: "general-discussion", updatedWithinDays: 7 });
      expect(db.thread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ lastActivityAt: expect.any(Object) }) }),
      );
    });

    it("filters by unanswered", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
        thread: { findMany: vi.fn().mockResolvedValue([]) },
      };
      const caller = createCaller({ db: db as never, session: null });
      await caller.thread.listByForum({ forumSlug: "general-discussion", unanswered: true });
      expect(db.thread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ replyCount: 0 }) }),
      );
    });

    it("sorts by title", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
        thread: { findMany: vi.fn().mockResolvedValue([]) },
      };
      const caller = createCaller({ db: db as never, session: null });
      await caller.thread.listByForum({ forumSlug: "general-discussion", sort: "title", direction: "asc" });
      expect(db.thread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: expect.arrayContaining([{ title: "asc" }]) }),
      );
    });

    it("sorts by reactions", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
        thread: { findMany: vi.fn().mockResolvedValue([]) },
      };
      const caller = createCaller({ db: db as never, session: null });
      await caller.thread.listByForum({ forumSlug: "general-discussion", sort: "reactions", direction: "desc" });
      expect(db.thread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: expect.arrayContaining([{ reactions: { _count: "desc" } }]) }),
      );
    });

    it("keeps pinned threads ahead of the requested sort order", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue(publicForum) },
        thread: { findMany: vi.fn().mockResolvedValue([]) },
      };
      const caller = createCaller({ db: db as never, session: null });
      await caller.thread.listByForum({ forumSlug: "general-discussion", sort: "latest", direction: "desc" });
      expect(db.thread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ isPinned: "desc" }, { lastActivityAt: "desc" }, { id: "desc" }],
        }),
      );
    });
  });

  describe("incrementView", () => {
    it("rejects increment for hidden thread", async () => {
      const db = {
        thread: {
          findUnique: vi.fn().mockResolvedValue({
            id: "thread-1", isDeleted: false,
            forum: { isPublic: false, category: { isPublic: true, section: { isPublic: true } } },
          }),
          update: vi.fn(),
        },
      };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.thread.incrementView({ id: "thread-1" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects increment for non-existent thread", async () => {
      const db = {
        thread: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() },
      };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.thread.incrementView({ id: "nope" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("increments the view count for a visible thread", async () => {
      const update = vi.fn().mockResolvedValue({});
      const db = {
        thread: {
          findUnique: vi.fn().mockResolvedValue({
            isDeleted: false,
            forum: { isPublic: true, category: { isPublic: true, section: { isPublic: true } } },
          }),
          update,
        },
      };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.thread.incrementView({ id: "thread-1" })).resolves.toEqual({ success: true });
      expect(update).toHaveBeenCalledWith({
        where: { id: "thread-1" },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe("updateOwn", () => {
    it("lets the owner edit thread title and body", async () => {
      const db = {
        thread: {
          findUnique: vi.fn().mockResolvedValue({ id: "thread-1", authorId: "member-1", isDeleted: false, forum: publicForum }),
          update: vi.fn(),
        },
        post: {
          findFirst: vi.fn().mockResolvedValue({ id: "post-1", isDeleted: false }),
          update: vi.fn(),
        },
        $transaction: vi.fn().mockResolvedValue([]),
      };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.thread.updateOwn({
        threadId: "thread-1",
        title: "Updated title",
        content: "Updated original thread body.",
      })).resolves.toEqual({ success: true });
      expect(db.thread.update).toHaveBeenCalled();
      expect(db.post.update).toHaveBeenCalled();
    });

    it("rejects thread edits by non-owners", async () => {
      const db = { thread: { findUnique: vi.fn().mockResolvedValue({ id: "thread-1", authorId: "other", isDeleted: false, forum: publicForum }) } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.thread.updateOwn({ threadId: "thread-1", title: "Updated title", content: "Updated body text." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects thread edits by suspended users", async () => {
      const caller = createCaller({ db: {} as never, session: { ...memberSession, user: { ...memberSession.user, isSuspended: true } } });
      await expect(caller.thread.updateOwn({ threadId: "thread-1", title: "Updated title", content: "Updated body text." })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects edits to deleted threads", async () => {
      const db = { thread: { findUnique: vi.fn().mockResolvedValue({ id: "thread-1", authorId: "member-1", isDeleted: true, forum: publicForum }) } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.thread.updateOwn({ threadId: "thread-1", title: "Updated title", content: "Updated body text." })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("validates thread edit input", async () => {
      const caller = createCaller({ db: {} as never, session: memberSession });
      await expect(caller.thread.updateOwn({ threadId: "thread-1", title: "No", content: "short" })).rejects.toThrow();
    });
  });

  describe("deleteOwn", () => {
    it("lets the owner delete a zero-reply thread", async () => {
      const db = {
        thread: {
          findUnique: vi.fn().mockResolvedValue({ id: "thread-1", authorId: "member-1", isDeleted: false, replyCount: 0, forum: publicForum }),
          update: vi.fn(),
        },
      };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.thread.deleteOwn({ threadId: "thread-1" })).resolves.toEqual({ success: true });
      expect(db.thread.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isDeleted: true } }));
    });

    it("blocks author deletion when a thread has replies", async () => {
      const db = { thread: { findUnique: vi.fn().mockResolvedValue({ id: "thread-1", authorId: "member-1", isDeleted: false, replyCount: 1, forum: publicForum }) } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.thread.deleteOwn({ threadId: "thread-1" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects thread deletion by non-owners", async () => {
      const db = { thread: { findUnique: vi.fn().mockResolvedValue({ id: "thread-1", authorId: "other", isDeleted: false, replyCount: 0, forum: publicForum }) } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.thread.deleteOwn({ threadId: "thread-1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });
});
