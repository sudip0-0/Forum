import { describe, expect, it, vi } from "vitest";
import type { Forum } from "@prisma/client";
import { appRouter } from "@/server/api/root";
import type { TrpcContext } from "@/server/api/trpc";

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

const adminSession: TrpcContext["session"] = {
  user: { id: "admin-1", email: "admin@example.com", name: "Admin", role: "ADMIN" },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

const moderatorSession: TrpcContext["session"] = {
  user: { id: "mod-1", email: "mod@example.com", name: "Mod", role: "MODERATOR" },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

const memberSession: TrpcContext["session"] = {
  user: { id: "member-1", email: "member@example.com", name: "Member", role: "MEMBER" },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

function makeForum(overrides: Partial<Forum> = {}): Forum {
  return {
    id: "forum-1", name: "Announcements", slug: "announcements",
    categoryId: "cat-1", description: null, sortOrder: 0,
    isPublic: true, isLocked: false,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as Forum;
}

describe("forum router", () => {
  describe("getBySlug", () => {
    it("returns a public forum with full chain", async () => {
      const forum = makeForum();
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue({ ...forum, category: { isPublic: true, section: { isPublic: true } } }) },
      };
      const caller = createCaller({ db: db as never, session: null });
      const result = await caller.forum.getBySlug({ slug: "announcements" });
      expect(result.slug).toBe("announcements");
    });

    it("rejects non-public forum", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue({ ...makeForum(), isPublic: false, category: { isPublic: true, section: { isPublic: true } } }) },
      };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.forum.getBySlug({ slug: "hidden" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects forum in non-public category", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue({ ...makeForum(), category: { isPublic: false, section: { isPublic: true } } }) },
      };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.forum.getBySlug({ slug: "test" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects forum in non-public section", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue({ ...makeForum(), category: { isPublic: true, section: { isPublic: false } } }) },
      };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.forum.getBySlug({ slug: "test" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("returns NOT_FOUND for missing forum", async () => {
      const db = { forum: { findUnique: vi.fn().mockResolvedValue(null) } };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.forum.getBySlug({ slug: "missing" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("create", () => {
    it("allows admin to create a forum", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue(makeForum()) },
      };
      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.forum.create({ categoryId: "cat-1", name: "Announcements" });
      expect(result.slug).toBe("announcements");
    });

    it("rejects duplicate slug", async () => {
      const db = {
        forum: { findUnique: vi.fn().mockResolvedValue(makeForum()), create: vi.fn() },
      };
      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(caller.forum.create({ categoryId: "cat-1", name: "Announcements" })).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("rejects creation by moderator", async () => {
      const db = { forum: { findUnique: vi.fn(), create: vi.fn() } };
      const caller = createCaller({ db: db as never, session: moderatorSession });
      await expect(caller.forum.create({ categoryId: "cat-1", name: "Test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects creation by member", async () => {
      const db = { forum: { findUnique: vi.fn(), create: vi.fn() } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.forum.create({ categoryId: "cat-1", name: "Test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects creation by guest", async () => {
      const db = { forum: { findUnique: vi.fn(), create: vi.fn() } };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.forum.create({ categoryId: "cat-1", name: "Test" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("update", () => {
    it("allows admin to update a forum", async () => {
      const db = {
        forum: {
          findUnique: vi.fn().mockResolvedValue(makeForum()),
          update: vi.fn().mockResolvedValue(makeForum({ name: "Updated", slug: "updated" })),
        },
      };
      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.forum.update({ id: "forum-1", name: "Updated" });
      expect(result.name).toBe("Updated");
    });

    it("returns NOT_FOUND for missing forum", async () => {
      const db = { forum: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() } };
      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(caller.forum.update({ id: "missing", name: "Updated" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects update by member", async () => {
      const db = { forum: { findUnique: vi.fn(), update: vi.fn() } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.forum.update({ id: "forum-1", name: "Hacked" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("reorder", () => {
    it("allows admin to reorder forums", async () => {
      const db = {
        $transaction: vi.fn().mockResolvedValue([]),
        forum: { update: vi.fn() },
      };
      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(caller.forum.reorder({ items: [{ id: "f1", sortOrder: 0 }] })).resolves.toEqual({ success: true });
    });

    it("rejects reorder by member", async () => {
      const db = { $transaction: vi.fn(), forum: { update: vi.fn() } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.forum.reorder({ items: [{ id: "f1", sortOrder: 0 }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("softDelete", () => {
    it("allows admin to soft-delete a forum", async () => {
      const db = {
        forum: {
          findUnique: vi.fn().mockResolvedValue(makeForum()),
          update: vi.fn().mockResolvedValue(makeForum({ isPublic: false })),
        },
      };
      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.forum.softDelete({ id: "forum-1" });
      expect(result.isPublic).toBe(false);
      expect(db.forum.update).toHaveBeenCalledWith({
        where: { id: "forum-1" },
        data: { isPublic: false },
      });
    });

    it("returns NOT_FOUND for a missing forum", async () => {
      const db = { forum: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() } };
      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(caller.forum.softDelete({ id: "missing" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects soft-delete by member", async () => {
      const db = { forum: { findUnique: vi.fn(), update: vi.fn() } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.forum.softDelete({ id: "forum-1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("listAll", () => {
    it("returns all forums for admin", async () => {
      const db = { forum: { findMany: vi.fn().mockResolvedValue([makeForum()]) } };
      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.forum.listAll();
      expect(result).toHaveLength(1);
    });

    it("rejects for member", async () => {
      const db = { forum: { findMany: vi.fn() } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.forum.listAll()).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("listForModeration", () => {
    it("returns lightweight list for moderator", async () => {
      const db = { forum: { findMany: vi.fn().mockResolvedValue([{ id: "f1", name: "General", slug: "general" }]) } };
      const caller = createCaller({ db: db as never, session: moderatorSession });
      const result = await caller.forum.listForModeration();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("General");
    });

    it("rejects for member", async () => {
      const db = { forum: { findMany: vi.fn() } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.forum.listForModeration()).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });
});
