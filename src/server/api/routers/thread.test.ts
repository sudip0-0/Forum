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
  category: { isPublic: true, section: { isPublic: true } },
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
});
