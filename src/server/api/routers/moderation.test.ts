import { describe, expect, it, vi } from "vitest";
import type { Post, Thread, Report } from "@prisma/client";
import { appRouter } from "@/server/api/root";
import type { TrpcContext } from "@/server/api/trpc";

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

const memberSession: TrpcContext["session"] = {
  user: {
    id: "member-1",
    email: "member@example.com",
    name: "Member",
    role: "MEMBER",
  },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: "report-1",
    reporterId: "member-1",
    postId: null,
    threadId: null,
    reason: "SPAM",
    note: null,
    status: "OPEN",
    createdAt: new Date(),
    resolvedAt: null,
    ...overrides,
  } as Report;
}

describe("moderation router", () => {
  describe("report", () => {
    it("allows member to report a post", async () => {
      const db = {
        post: {
          findUnique: vi.fn().mockResolvedValue({
            id: "post-1",
            isDeleted: false,
          } as Post),
        },
        report: {
          create: vi.fn().mockResolvedValue(
            makeReport({ postId: "post-1", reason: "SPAM" }),
          ),
        },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      const result = await caller.moderation.report({
        postId: "post-1",
        reason: "SPAM",
      });

      expect(result.reason).toBe("SPAM");
      expect(result.status).toBe("OPEN");
      expect(result.postId).toBe("post-1");
    });

    it("allows member to report a thread", async () => {
      const db = {
        thread: {
          findUnique: vi.fn().mockResolvedValue({
            id: "thread-1",
            isDeleted: false,
          } as Thread),
        },
        report: {
          create: vi.fn().mockResolvedValue(
            makeReport({ threadId: "thread-1", reason: "HARASSMENT" }),
          ),
        },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      const result = await caller.moderation.report({
        threadId: "thread-1",
        reason: "HARASSMENT",
      });

      expect(result.reason).toBe("HARASSMENT");
      expect(result.status).toBe("OPEN");
      expect(result.threadId).toBe("thread-1");
    });

    it("allows an optional note", async () => {
      const db = {
        post: {
          findUnique: vi.fn().mockResolvedValue({
            id: "post-1",
            isDeleted: false,
          } as Post),
        },
        report: {
          create: vi.fn().mockResolvedValue(
            makeReport({ postId: "post-1", note: "This is spam" }),
          ),
        },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      const result = await caller.moderation.report({
        postId: "post-1",
        reason: "SPAM",
        note: "This is spam",
      });

      expect(result.note).toBe("This is spam");
    });

    it("rejects report by guest (no session)", async () => {
      const db = {
        post: { findUnique: vi.fn() },
        report: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(
        caller.moderation.report({
          postId: "post-1",
          reason: "SPAM",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("rejects report with neither postId nor threadId", async () => {
      const db = {
        post: { findUnique: vi.fn() },
        report: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.moderation.report({
          reason: "SPAM",
        } as never),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects report with both postId and threadId", async () => {
      const db = {
        post: { findUnique: vi.fn() },
        report: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.moderation.report({
          postId: "post-1",
          threadId: "thread-1",
          reason: "SPAM",
        } as never),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects report for non-existent post", async () => {
      const db = {
        post: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        report: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.moderation.report({
          postId: "nonexistent",
          reason: "SPAM",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects report for non-existent thread", async () => {
      const db = {
        thread: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        report: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.moderation.report({
          threadId: "nonexistent",
          reason: "SPAM",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects report for deleted post", async () => {
      const db = {
        post: {
          findUnique: vi.fn().mockResolvedValue({
            id: "post-1",
            isDeleted: true,
          } as Post),
        },
        report: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.moderation.report({
          postId: "post-1",
          reason: "SPAM",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects report for deleted thread", async () => {
      const db = {
        thread: {
          findUnique: vi.fn().mockResolvedValue({
            id: "thread-1",
            isDeleted: true,
          } as Thread),
        },
        report: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.moderation.report({
          threadId: "thread-1",
          reason: "SPAM",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects duplicate report with CONFLICT", async () => {
      const p2002Error = Object.assign(new Error("Unique constraint failed"), {
        code: "P2002",
      });

      const db = {
        post: {
          findUnique: vi.fn().mockResolvedValue({
            id: "post-1",
            isDeleted: false,
          } as Post),
        },
        report: {
          create: vi.fn().mockRejectedValue(p2002Error),
        },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.moderation.report({
          postId: "post-1",
          reason: "SPAM",
        }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("rejects duplicate thread report with CONFLICT", async () => {
      const p2002Error = Object.assign(new Error("Unique constraint failed"), {
        code: "P2002",
      });

      const db = {
        thread: {
          findUnique: vi.fn().mockResolvedValue({
            id: "thread-1",
            isDeleted: false,
          } as Thread),
        },
        report: {
          create: vi.fn().mockRejectedValue(p2002Error),
        },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.moderation.report({
          threadId: "thread-1",
          reason: "SPAM",
        }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("rejects self-report on own post", async () => {
      const db = {
        post: {
          findUnique: vi.fn().mockResolvedValue({
            id: "post-1",
            isDeleted: false,
            authorId: "member-1",
          }),
        },
        report: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.moderation.report({ postId: "post-1", reason: "SPAM" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects self-report on own thread", async () => {
      const db = {
        thread: {
          findUnique: vi.fn().mockResolvedValue({
            id: "thread-1",
            isDeleted: false,
            authorId: "member-1",
          }),
        },
        report: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.moderation.report({ threadId: "thread-1", reason: "SPAM" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });
});
