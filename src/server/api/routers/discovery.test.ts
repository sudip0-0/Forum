import { describe, expect, it, vi } from "vitest";
import { appRouter } from "@/server/api/root";
import type { TrpcContext } from "@/server/api/trpc";

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

describe("discovery router", () => {
  it("returns aggregated homepage data", async () => {
    const mockPosts = [{ id: "p1", content: "Hello", author: { username: "u1", displayName: null }, thread: { title: "Test", slug: "test", forum: { slug: "general", name: "General" } } }];
    const mockThreads = [{ id: "t1", title: "Active", slug: "active", forum: { slug: "general", name: "General" }, tags: [] }];
    const mockPopular = [{ id: "t2", title: "Popular", slug: "popular", forum: { slug: "general", name: "General" } }];
    const mockTags = [{ id: "tag-1", name: "help", _count: { threads: 5 } }];

    const db = {
      post: { findMany: vi.fn().mockResolvedValue(mockPosts), count: vi.fn().mockResolvedValue(100) },
      thread: { findMany: vi.fn().mockResolvedValueOnce(mockThreads).mockResolvedValueOnce(mockPopular), count: vi.fn().mockResolvedValue(50) },
      tag: { findMany: vi.fn().mockResolvedValue(mockTags) },
      user: { count: vi.fn().mockResolvedValue(42) },
    };

    const caller = createCaller({ db: db as never, session: null });
    const result = await caller.discovery.home();

    expect(result.latestMessages).toHaveLength(1);
    expect(result.activeThreads).toHaveLength(1);
    expect(result.popularThreads).toHaveLength(1);
    expect(result.popularTags).toHaveLength(1);
    expect(result.stats).toEqual({ users: 42, threads: 50, messages: 100 });
  });

  it("excludes deleted posts from latest messages", async () => {
    const db = {
      post: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
      thread: { findMany: vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]), count: vi.fn().mockResolvedValue(0) },
      tag: { findMany: vi.fn().mockResolvedValue([]) },
      user: { count: vi.fn().mockResolvedValue(0) },
    };

    const caller = createCaller({ db: db as never, session: null });
    await caller.discovery.home();

    expect(db.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isDeleted: false }) }),
    );
  });

  it("excludes threads from non-public forums", async () => {
    const db = {
      post: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
      thread: { findMany: vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]), count: vi.fn().mockResolvedValue(0) },
      tag: { findMany: vi.fn().mockResolvedValue([]) },
      user: { count: vi.fn().mockResolvedValue(0) },
    };

    const caller = createCaller({ db: db as never, session: null });
    await caller.discovery.home();

    const callArgs = db.post.findMany.mock.calls[0][0];
    expect(callArgs.where.thread.forum.isPublic).toBe(true);
    expect(callArgs.where.thread.forum.category.isPublic).toBe(true);
    expect(callArgs.where.thread.forum.category.section.isPublic).toBe(true);
  });

  it("works for guests", async () => {
    const db = {
      post: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
      thread: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
      tag: { findMany: vi.fn().mockResolvedValue([]) },
      user: { count: vi.fn().mockResolvedValue(0) },
    };

    const caller = createCaller({ db: db as never, session: null });
    await expect(caller.discovery.home()).resolves.toBeDefined();
  });

  it("handles empty state gracefully", async () => {
    const db = {
      post: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
      thread: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
      tag: { findMany: vi.fn().mockResolvedValue([]) },
      user: { count: vi.fn().mockResolvedValue(0) },
    };

    const caller = createCaller({ db: db as never, session: null });
    const result = await caller.discovery.home();
    expect(result.latestMessages).toEqual([]);
    expect(result.activeThreads).toEqual([]);
    expect(result.stats.users).toBe(0);
  });
});
