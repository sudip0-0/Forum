import { describe, expect, it, vi } from "vitest";
import { appRouter } from "@/server/api/root";
import type { TrpcContext } from "@/server/api/trpc";

const memberSession: TrpcContext["session"] = {
  user: { id: "member-1", email: "member@example.com", name: "Member", role: "MEMBER" },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

describe("reaction router", () => {
  it("creates a default reaction when none exists", async () => {
    const db = {
      post: { findUnique: vi.fn().mockResolvedValue({ id: "post-1", isDeleted: false }) },
      reaction: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "reaction-1" }),
      },
    };
    const caller = appRouter.createCaller({ db: db as never, session: memberSession });
    await expect(caller.reaction.toggle({ postId: "post-1", emoji: "LIKE" })).resolves.toEqual({
      active: true,
      emoji: "LIKE",
    });
  });

  it("replaces an existing reaction with another emoji", async () => {
    const db = {
      post: { findUnique: vi.fn().mockResolvedValue({ id: "post-1", isDeleted: false }) },
      reaction: {
        findUnique: vi.fn().mockResolvedValue({ id: "reaction-1", emoji: "LIKE" }),
        update: vi.fn(),
      },
    };
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
    const db = {
      post: { findUnique: vi.fn().mockResolvedValue({ id: "post-1", isDeleted: false }) },
      reaction: {
        findUnique: vi.fn().mockResolvedValue({ id: "reaction-1", emoji: "LIKE" }),
        delete: vi.fn(),
      },
    };
    const caller = appRouter.createCaller({ db: db as never, session: memberSession });
    await expect(caller.reaction.toggle({ postId: "post-1", emoji: "LIKE" })).resolves.toEqual({
      active: false,
      emoji: null,
    });
  });
});
