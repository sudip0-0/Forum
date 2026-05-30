import { describe, expect, it, vi } from "vitest";
import type { Section } from "@prisma/client";
import { appRouter } from "@/server/api/root";
import type { TrpcContext } from "@/server/api/trpc";

function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

const adminSession: TrpcContext["session"] = {
  user: { id: "admin-1", email: "admin@example.com", name: "Admin", role: "ADMIN" },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

const memberSession: TrpcContext["session"] = {
  user: { id: "member-1", email: "member@example.com", name: "Member", role: "MEMBER" },
  expires: new Date(Date.now() + 3600000).toISOString(),
};

function makeSection(overrides: Partial<Section> = {}): Section {
  return {
    id: "sec-1", name: "Community", slug: "community",
    description: null, sortOrder: 0,
    isPublic: true, isLocked: false,
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as Section;
}

describe("section router", () => {
  describe("listPublicTree", () => {
    it("returns public sections with public categories and forums", async () => {
      const db = {
        section: { findMany: vi.fn().mockResolvedValue([{ ...makeSection(), categories: [] }]) },
      };
      const caller = createCaller({ db: db as never, session: null });
      const result = await caller.section.listPublicTree();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Community");
      expect(db.section.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isPublic: true } }),
      );
    });

    it("filters out non-public sections", async () => {
      const db = { section: { findMany: vi.fn().mockResolvedValue([]) } };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.section.listPublicTree()).resolves.toEqual([]);
    });

    it("works for guests", async () => {
      const db = { section: { findMany: vi.fn().mockResolvedValue([]) } };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.section.listPublicTree()).resolves.toEqual([]);
    });
  });

  describe("listAll", () => {
    it("returns all sections for admin", async () => {
      const db = { section: { findMany: vi.fn().mockResolvedValue([makeSection()]) } };
      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.section.listAll();
      expect(result).toHaveLength(1);
    });

    it("rejects for member", async () => {
      const db = { section: { findMany: vi.fn() } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.section.listAll()).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("rejects for guest", async () => {
      const db = { section: { findMany: vi.fn() } };
      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.section.listAll()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });

  describe("create", () => {
    it("allows admin to create a section", async () => {
      const db = {
        section: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue(makeSection()) },
      };
      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.section.create({ name: "Community" });
      expect(result.slug).toBe("community");
    });

    it("rejects duplicate slug", async () => {
      const db = {
        section: { findUnique: vi.fn().mockResolvedValue(makeSection()), create: vi.fn() },
      };
      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(caller.section.create({ name: "Community" })).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("rejects creation by member", async () => {
      const db = { section: { findUnique: vi.fn(), create: vi.fn() } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.section.create({ name: "Test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("update", () => {
    it("allows admin to update a section", async () => {
      const db = {
        section: {
          findUnique: vi.fn().mockResolvedValue(makeSection()),
          update: vi.fn().mockResolvedValue(makeSection({ name: "Updated", slug: "updated" })),
        },
      };
      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.section.update({ id: "sec-1", name: "Updated" });
      expect(result.name).toBe("Updated");
    });

    it("returns NOT_FOUND for missing section", async () => {
      const db = { section: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() } };
      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(caller.section.update({ id: "missing", name: "Updated" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects update by member", async () => {
      const db = { section: { findUnique: vi.fn(), update: vi.fn() } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.section.update({ id: "sec-1", name: "Hacked" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("reorder", () => {
    it("allows admin to reorder sections", async () => {
      const db = {
        $transaction: vi.fn().mockResolvedValue([]),
        section: { update: vi.fn() },
      };
      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(caller.section.reorder({ items: [{ id: "s1", sortOrder: 0 }] })).resolves.toEqual({ success: true });
    });

    it("rejects reorder by member", async () => {
      const db = { $transaction: vi.fn(), section: { update: vi.fn() } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.section.reorder({ items: [{ id: "s1", sortOrder: 0 }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  describe("softDelete", () => {
    it("allows admin to soft-delete a section", async () => {
      const db = {
        section: {
          findUnique: vi.fn().mockResolvedValue(makeSection()),
          update: vi.fn().mockResolvedValue(makeSection({ isPublic: false })),
        },
      };
      const caller = createCaller({ db: db as never, session: adminSession });
      const result = await caller.section.softDelete({ id: "sec-1" });
      expect(result.isPublic).toBe(false);
      expect(db.section.update).toHaveBeenCalledWith({
        where: { id: "sec-1" },
        data: { isPublic: false },
      });
    });

    it("returns NOT_FOUND for a missing section", async () => {
      const db = { section: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() } };
      const caller = createCaller({ db: db as never, session: adminSession });
      await expect(caller.section.softDelete({ id: "missing" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("rejects soft-delete by member", async () => {
      const db = { section: { findUnique: vi.fn(), update: vi.fn() } };
      const caller = createCaller({ db: db as never, session: memberSession });
      await expect(caller.section.softDelete({ id: "sec-1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });
});
