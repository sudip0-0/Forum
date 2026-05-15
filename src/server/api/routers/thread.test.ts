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

const publicForum = {
  id: "forum-1",
  slug: "general-discussion",
  isPublic: true,
  isLocked: false,
  category: { isPublic: true, isLocked: false, section: { isPublic: true, isLocked: false } },
};

describe("thread router", () => {
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

  it("rejects locked forums", async () => {
    const db = {
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
  });
});
