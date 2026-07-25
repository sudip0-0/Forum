import { describe, expect, it, vi } from "vitest";
import { appRouter } from "@/server/api/root";
import type { TrpcContext } from "@/server/api/trpc";

const memberSession: TrpcContext["session"] = {
  user: { id: "member-1", email: "member@example.com", name: "Member", role: "MEMBER" },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

const visibleThread = {
  isDeleted: false,
  forum: {
    isPublic: true,
    isDeleted: false,
    category: {
      isPublic: true,
      isDeleted: false,
      section: { isPublic: true, isDeleted: false },
    },
  },
};

const visiblePost = {
  id: "post-1",
  isDeleted: false,
  thread: visibleThread,
};

function withTransaction<T extends Record<string, unknown>>(db: T) {
  return {
    ...db,
    $transaction: vi.fn(async (fn: (tx: T) => Promise<unknown>) => fn(db)),
  };
}

describe("reaction router", () => {
  it("creates a default reaction when none exists", async () => {
    const db = withTransaction({
      post: { findUnique: vi.fn().mockResolvedValue(visiblePost) },
      reaction: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "reaction-1" }),
      },
    });
    const caller = appRouter.createCaller({ db: db as never, session: memberSession });
    await expect(caller.reaction.toggle({ postId: "post-1", emoji: "LIKE" })).resolves.toEqual({
      active: true,
      emoji: "LIKE",
    });
  });

  it("replaces an existing reaction with another emoji", async () => {
    const db = withTransaction({
      post: { findUnique: vi.fn().mockResolvedValue(visiblePost) },
      reaction: {
        findUnique: vi.fn().mockResolvedValue({ id: "reaction-1", emoji: "LIKE" }),
        update: vi.fn(),
      },
    });
    const caller = appRouter.createCaller({ db: db as never, session: memberSession });
    await expect(caller.reaction.toggle({ postId: "post-1", emoji: "HELPFUL" })).resolves.toEqual({
      active: true,
      emoji: "HELPFUL",
    });
    expect(db.reaction.update).toHaveBeenCalledWith({
      where: { id: "reaction-1" },
      data: { emoji: "HELPFUL" },
    });
  });

  it("removes the same reaction when clicked again", async () => {
    const db = withTransaction({
      post: { findUnique: vi.fn().mockResolvedValue(visiblePost) },
      reaction: {
        findUnique: vi.fn().mockResolvedValue({ id: "reaction-1", emoji: "LIKE" }),
        delete: vi.fn(),
      },
    });
    const caller = appRouter.createCaller({ db: db as never, session: memberSession });
    await expect(caller.reaction.toggle({ postId: "post-1", emoji: "LIKE" })).resolves.toEqual({
      active: false,
      emoji: null,
    });
  });

  it("rejects reaction on a private forum target", async () => {
    const db = withTransaction({
      post: {
        findUnique: vi.fn().mockResolvedValue({
          ...visiblePost,
          thread: {
            ...visibleThread,
            forum: { ...visibleThread.forum, isPublic: false },
          },
        }),
      },
      reaction: { findUnique: vi.fn(), create: vi.fn() },
    });
    const caller = appRouter.createCaller({ db: db as never, session: memberSession });
    await expect(caller.reaction.toggle({ postId: "post-1", emoji: "LIKE" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("rejects reaction by suspended user", async () => {
    const suspendedSession = { ...memberSession, user: { ...memberSession.user, isSuspended: true } };
    const db = withTransaction({
      post: { findUnique: vi.fn() },
      reaction: { findUnique: vi.fn() },
    });
    const caller = appRouter.createCaller({ db: db as never, session: suspendedSession });
    await expect(caller.reaction.toggle({ postId: "post-1", emoji: "LIKE" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
