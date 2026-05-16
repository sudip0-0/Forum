import { describe, expect, it, vi } from "vitest";
import type { Report, User } from "@prisma/client";
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

const moderatorSession: TrpcContext["session"] = {
  user: {
    id: "mod-1",
    email: "mod@example.com",
    name: "Mod",
    role: "MODERATOR",
  },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

const adminSession: TrpcContext["session"] = {
  user: {
    id: "admin-1",
    email: "admin@example.com",
    name: "Admin",
    role: "ADMIN",
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

const visibleForum = {
  isPublic: true,
  category: {
    isPublic: true,
    section: { isPublic: true },
  },
};

function makeReportableThread(overrides: Record<string, unknown> = {}) {
  return {
    id: "thread-1",
    authorId: "author-1",
    isDeleted: false,
    forum: visibleForum,
    ...overrides,
  };
}

function makeReportablePost(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    authorId: "author-1",
    isDeleted: false,
    thread: makeReportableThread(),
    ...overrides,
  };
}

describe("moderation router", () => {
  describe("report", () => {
    it("allows member to report a post", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        post: {
          findUnique: vi.fn().mockResolvedValue(makeReportablePost()),
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
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: {
          findUnique: vi.fn().mockResolvedValue(makeReportableThread()),
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
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        post: {
          findUnique: vi.fn().mockResolvedValue(makeReportablePost()),
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
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
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
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
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
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        post: {
          findUnique: vi.fn().mockResolvedValue(makeReportablePost({ isDeleted: true })),
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
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: {
          findUnique: vi.fn().mockResolvedValue(makeReportableThread({ isDeleted: true })),
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

    it("rejects report for a post in a hidden forum", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        post: {
          findUnique: vi.fn().mockResolvedValue(
            makeReportablePost({
              thread: makeReportableThread({
                forum: { ...visibleForum, isPublic: false },
              }),
            }),
          ),
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
      expect(db.report.create).not.toHaveBeenCalled();
    });

    it("rejects report for a hidden thread", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: {
          findUnique: vi.fn().mockResolvedValue(
            makeReportableThread({
              forum: { ...visibleForum, isPublic: false },
            }),
          ),
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
      expect(db.report.create).not.toHaveBeenCalled();
    });

    it("rejects duplicate report with CONFLICT", async () => {
      const p2002Error = Object.assign(new Error("Unique constraint failed"), {
        code: "P2002",
      });

      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        post: {
          findUnique: vi.fn().mockResolvedValue(makeReportablePost()),
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
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: {
          findUnique: vi.fn().mockResolvedValue(makeReportableThread()),
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
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        post: {
          findUnique: vi.fn().mockResolvedValue(makeReportablePost({ authorId: "member-1" })),
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
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: new Date() }) },
        thread: {
          findUnique: vi.fn().mockResolvedValue(makeReportableThread({ authorId: "member-1" })),
        },
        report: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.moderation.report({ threadId: "thread-1", reason: "SPAM" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects report by suspended user", async () => {
      const suspendedSession = { ...memberSession, user: { ...memberSession.user, isSuspended: true } };
      const db = {
        post: { findUnique: vi.fn() },
        report: { create: vi.fn() },
      };
      const caller = createCaller({ db: db as never, session: suspendedSession });
      await expect(
        caller.moderation.report({ postId: "post-1", reason: "SPAM" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("listQueue", () => {
    it("allows moderator to list open reports", async () => {
      const db = {
        report: {
          findMany: vi.fn().mockResolvedValue([
            makeReport({
              id: "r1",
              postId: "post-1",
              reason: "SPAM",
              status: "OPEN",
            }),
          ]),
        },
      };

      const caller = createCaller({
        db: db as never,
        session: moderatorSession,
      });
      const result = await caller.moderation.listQueue({ limit: 20 });

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].status).toBe("OPEN");
    });

    it("allows admin to list open reports", async () => {
      const db = {
        report: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.moderation.listQueue({ limit: 20 });

      expect(result.reports).toHaveLength(0);
    });

    it("rejects member from viewing queue", async () => {
      const db = { report: { findMany: vi.fn() } };

      const caller = createCaller({
        db: db as never,
        session: memberSession,
      });
      await expect(
        caller.moderation.listQueue({ limit: 20 }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects guest from viewing queue", async () => {
      const db = { report: { findMany: vi.fn() } };

      const caller = createCaller({ db: db as never, session: null });
      await expect(
        caller.moderation.listQueue({ limit: 20 }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("resolve", () => {
    function makeReportForResolve() {
      return {
        id: "report-1",
        status: "OPEN",
        postId: "post-1",
        threadId: null,
        post: { id: "post-1", threadId: "thread-1" },
        thread: null,
      };
    }

    it("allows moderator to dismiss a report", async () => {
      const db = {
        report: {
          findUnique: vi.fn().mockResolvedValue(makeReportForResolve()),
          update: vi.fn().mockResolvedValue({}),
        },
        post: { findUnique: vi.fn().mockResolvedValue({ authorId: "user-1" }) },
        moderationLog: { create: vi.fn().mockResolvedValue({}) },
        $transaction: vi
          .fn()
          .mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
            await fn(db);
          }),
      };

      const caller = createCaller({
        db: db as never,
        session: moderatorSession,
      });
      const result = await caller.moderation.resolve({
        reportId: "report-1",
        action: "DISMISS",
        reason: "Not a violation",
      });

      expect(result.success).toBe(true);
    });

    it("allows admin to resolve a report", async () => {
      const db = {
        report: {
          findUnique: vi.fn().mockResolvedValue(makeReportForResolve()),
          update: vi.fn().mockResolvedValue({}),
        },
        post: { findUnique: vi.fn().mockResolvedValue({ authorId: "user-1" }) },
        moderationLog: { create: vi.fn().mockResolvedValue({}) },
        $transaction: vi
          .fn()
          .mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
            await fn(db);
          }),
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.moderation.resolve({
        reportId: "report-1",
        action: "DISMISS",
        reason: "Not a violation",
      });

      expect(result.success).toBe(true);
    });

    it("rejects resolve by member", async () => {
      const db = { report: { findUnique: vi.fn() } };

      const caller = createCaller({
        db: db as never,
        session: memberSession,
      });
      await expect(
        caller.moderation.resolve({
          reportId: "report-1",
          action: "DISMISS",
          reason: "Not a violation",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects resolve by guest", async () => {
      const db = { report: { findUnique: vi.fn() } };

      const caller = createCaller({ db: db as never, session: null });
      await expect(
        caller.moderation.resolve({
          reportId: "report-1",
          action: "DISMISS",
          reason: "Not a violation",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("rejects resolve of non-existent report", async () => {
      const db = {
        report: { findUnique: vi.fn().mockResolvedValue(null) },
      };

      const caller = createCaller({
        db: db as never,
        session: moderatorSession,
      });
      await expect(
        caller.moderation.resolve({
          reportId: "nonexistent",
          action: "DISMISS",
          reason: "Not a violation",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects resolve of already resolved report", async () => {
      const db = {
        report: {
          findUnique: vi.fn().mockResolvedValue({
            id: "report-1",
            status: "RESOLVED",
            postId: null,
            threadId: null,
            post: null,
            thread: null,
          }),
        },
      };

      const caller = createCaller({
        db: db as never,
        session: moderatorSession,
      });
      await expect(
        caller.moderation.resolve({
          reportId: "report-1",
          action: "DISMISS",
          reason: "Already handled",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("soft-deletes post via SOFT_DELETE_POST action", async () => {
      const db = {
        report: {
          findUnique: vi.fn().mockResolvedValue({
            id: "report-1",
            status: "OPEN",
            postId: "post-1",
            threadId: null,
            post: { id: "post-1", threadId: "thread-1" },
            thread: null,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        post: {
          findUnique: vi.fn().mockResolvedValue({ authorId: "user-1" }),
          update: vi.fn().mockResolvedValue({}),
        },
        moderationLog: { create: vi.fn().mockResolvedValue({}) },
        $transaction: vi
          .fn()
          .mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
            await fn(db);
          }),
      };

      const caller = createCaller({
        db: db as never,
        session: moderatorSession,
      });
      const result = await caller.moderation.resolve({
        reportId: "report-1",
        action: "SOFT_DELETE_POST",
        reason: "Inappropriate content",
      });

      expect(result.success).toBe(true);
    });

    it("locks thread via LOCK_THREAD action", async () => {
      const db = {
        report: {
          findUnique: vi.fn().mockResolvedValue({
            id: "report-1",
            status: "OPEN",
            postId: null,
            threadId: "thread-1",
            post: null,
            thread: { id: "thread-1", categoryId: "cat-1" },
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        thread: {
          findUnique: vi.fn().mockResolvedValue({ authorId: "user-1" }),
          update: vi.fn().mockResolvedValue({}),
        },
        moderationLog: { create: vi.fn().mockResolvedValue({}) },
        $transaction: vi
          .fn()
          .mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
            await fn(db);
          }),
      };

      const caller = createCaller({
        db: db as never,
        session: moderatorSession,
      });
      const result = await caller.moderation.resolve({
        reportId: "report-1",
        action: "LOCK_THREAD",
        reason: "Discussion getting heated",
      });

      expect(result.success).toBe(true);
    });

    it("creates moderation log on resolve", async () => {
      const db = {
        report: {
          findUnique: vi.fn().mockResolvedValue({
            id: "report-1",
            status: "OPEN",
            postId: "post-1",
            threadId: null,
            post: { id: "post-1", threadId: "thread-1" },
            thread: null,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        post: {
          findUnique: vi.fn().mockResolvedValue({ authorId: "user-1" }),
          update: vi.fn().mockResolvedValue({}),
        },
        moderationLog: { create: vi.fn().mockResolvedValue({}) },
        $transaction: vi
          .fn()
          .mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
            await fn(db);
          }),
      };

      const caller = createCaller({
        db: db as never,
        session: moderatorSession,
      });
      await caller.moderation.resolve({
        reportId: "report-1",
        action: "SOFT_DELETE_POST",
        reason: "Inappropriate",
      });

      expect(db.moderationLog.create).toHaveBeenCalledTimes(1);
    });

    it("rejects SOFT_DELETE_POST on thread-only report", async () => {
      const db = {
        report: {
          findUnique: vi.fn().mockResolvedValue({
            id: "report-1",
            status: "OPEN",
            postId: null,
            threadId: "thread-1",
            post: null,
            thread: { id: "thread-1", categoryId: "cat-1" },
          }),
        },
      };

      const caller = createCaller({ db: db as never, session: moderatorSession });
      await expect(
        caller.moderation.resolve({ reportId: "report-1", action: "SOFT_DELETE_POST", reason: "Bad content" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects SOFT_DELETE_THREAD on post-only report", async () => {
      const db = {
        report: {
          findUnique: vi.fn().mockResolvedValue({
            id: "report-1",
            status: "OPEN",
            postId: "post-1",
            threadId: null,
            post: { id: "post-1", threadId: "thread-1" },
            thread: null,
          }),
        },
      };

      const caller = createCaller({ db: db as never, session: moderatorSession });
      await expect(
        caller.moderation.resolve({ reportId: "report-1", action: "SOFT_DELETE_THREAD", reason: "Bad content" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects LOCK_THREAD on post-only report", async () => {
      const db = {
        report: {
          findUnique: vi.fn().mockResolvedValue({
            id: "report-1",
            status: "OPEN",
            postId: "post-1",
            threadId: null,
            post: { id: "post-1", threadId: "thread-1" },
            thread: null,
          }),
        },
      };

      const caller = createCaller({ db: db as never, session: moderatorSession });
      await expect(
        caller.moderation.resolve({ reportId: "report-1", action: "LOCK_THREAD", reason: "Bad content" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("listUsers", () => {
    it("allows admin to list users", async () => {
      const users = [
        {
          id: "user-1",
          username: "alice",
          displayName: "Alice",
          email: "alice@example.com",
          role: "MEMBER",
          createdAt: new Date(),
        } as User,
      ];
      const db = { user: { findMany: vi.fn().mockResolvedValue(users) } };

      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.moderation.listUsers({ limit: 20 });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].username).toBe("alice");
    });

    it("rejects member from listing users", async () => {
      const db = { user: { findMany: vi.fn() } };

      const caller = createCaller({
        db: db as never,
        session: memberSession,
      });
      await expect(
        caller.moderation.listUsers({ limit: 20 }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects moderator from listing users", async () => {
      const db = { user: { findMany: vi.fn() } };

      const caller = createCaller({
        db: db as never,
        session: moderatorSession,
      });
      await expect(
        caller.moderation.listUsers({ limit: 20 }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects guest from listing users", async () => {
      const db = { user: { findMany: vi.fn() } };

      const caller = createCaller({ db: db as never, session: null });
      await expect(
        caller.moderation.listUsers({ limit: 20 }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("changeRole", () => {
    it("allows admin to change user role", async () => {
      const db = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: "user-1",
            role: "MEMBER",
          }),
          update: vi.fn().mockResolvedValue({}),
          count: vi.fn().mockResolvedValue(2),
        },
        moderationLog: { create: vi.fn().mockResolvedValue({}) },
        $transaction: vi
          .fn()
          .mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
            await fn(db);
          }),
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.moderation.changeRole({
        userId: "user-1",
        role: "MODERATOR",
      });

      expect(result.success).toBe(true);
    });

    it("rejects change to same role", async () => {
      const db = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: "user-1",
            role: "MEMBER",
          }),
        },
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(
        caller.moderation.changeRole({
          userId: "user-1",
          role: "MEMBER",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("prevents demoting the last admin", async () => {
      const db = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: "admin-1",
            role: "ADMIN",
          }),
          count: vi.fn().mockResolvedValue(1),
        },
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(
        caller.moderation.changeRole({
          userId: "admin-1",
          role: "MEMBER",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects role change by moderator", async () => {
      const db = { user: { findUnique: vi.fn() } };

      const caller = createCaller({
        db: db as never,
        session: moderatorSession,
      });
      await expect(
        caller.moderation.changeRole({
          userId: "user-1",
          role: "MODERATOR",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects role change by member", async () => {
      const db = { user: { findUnique: vi.fn() } };

      const caller = createCaller({
        db: db as never,
        session: memberSession,
      });
      await expect(
        caller.moderation.changeRole({
          userId: "user-1",
          role: "MODERATOR",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects role change by guest", async () => {
      const db = { user: { findUnique: vi.fn() } };

      const caller = createCaller({ db: db as never, session: null });
      await expect(
        caller.moderation.changeRole({
          userId: "user-1",
          role: "MODERATOR",
        }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("returns NOT_FOUND for non-existent user", async () => {
      const db = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(
        caller.moderation.changeRole({
          userId: "nonexistent",
          role: "MODERATOR",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("suspendUser", () => {
    it("allows admin to suspend a user", async () => {
      const db = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: "user-1", role: "MEMBER" }),
          update: vi.fn().mockResolvedValue({}),
          count: vi.fn(),
        },
        moderationLog: { create: vi.fn().mockResolvedValue({}) },
        $transaction: vi.fn().mockResolvedValue([]),
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(
        caller.moderation.suspendUser({
          userId: "user-1",
          isSuspended: true,
          reason: "Repeated spam",
        }),
      ).resolves.toEqual({ success: true });
    });

    it("rejects user suspension by moderator", async () => {
      const db = {
        user: { findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
        moderationLog: { create: vi.fn() },
      };

      const caller = createCaller({ db: db as never, session: moderatorSession });
      await expect(
        caller.moderation.suspendUser({
          userId: "user-1",
          isSuspended: true,
          reason: "Repeated spam",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(db.user.findUnique).not.toHaveBeenCalled();
    });

    it("prevents suspending the last active admin", async () => {
      const db = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: "admin-1", role: "ADMIN" }),
          update: vi.fn(),
          count: vi.fn().mockResolvedValue(1),
        },
        moderationLog: { create: vi.fn() },
        $transaction: vi.fn(),
      };

      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(
        caller.moderation.suspendUser({
          userId: "admin-1",
          isSuspended: true,
          reason: "Emergency lockout",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(db.user.update).not.toHaveBeenCalled();
    });
  });

  describe("adminStats", () => {
    it("returns admin stats for admin", async () => {
      const db = {
        user: { count: vi.fn().mockResolvedValue(42) },
        thread: { count: vi.fn().mockResolvedValue(15) },
        report: { count: vi.fn().mockResolvedValue(3) },
        forum: { count: vi.fn().mockResolvedValue(8) },
      };
      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.moderation.adminStats();
      expect(result).toEqual({
        totalUsers: 42,
        totalVisibleThreads: 15,
        openReports: 3,
        visibleForums: 8,
      });
    });

    it("rejects report by unverified user", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ emailVerified: null }) },
        post: { findUnique: vi.fn() },
        report: { create: vi.fn() },
      };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(
        caller.moderation.report({ postId: "post-1", reason: "SPAM" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects moderator", async () => {
      const db = {};
      const caller = createCaller({ db: db as never, session: moderatorSession });
      await expect(caller.moderation.adminStats()).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects member", async () => {
      const db = {};
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.moderation.adminStats()).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });
});
