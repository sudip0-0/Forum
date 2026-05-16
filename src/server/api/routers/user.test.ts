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

describe("user router", () => {
  describe("getPublicProfile", () => {
    it("returns public profile without email or passwordHash", async () => {
      const user = {
        id: "u1",
        username: "testuser",
        displayName: "Test",
        image: null,
        bio: "Hello",
        createdAt: new Date(),
        threads: [],
      };
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue(user) },
      };

      const caller = createCaller({ db: db as never, session: null });
      const result = await caller.user.getPublicProfile({ username: "testuser" });

      expect(result.username).toBe("testuser");
      expect(result).not.toHaveProperty("email");
      expect(result).not.toHaveProperty("passwordHash");
      expect(db.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            threads: expect.objectContaining({
              where: {
                isDeleted: false,
                forum: { isPublic: true, category: { isPublic: true, section: { isPublic: true } } },
              },
            }),
          }),
        }),
      );
    });

    it("returns NOT_FOUND for missing user", async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue(null) },
      };

      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.user.getPublicProfile({ username: "nope" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("updateProfile", () => {
    it("allows user to update own profile", async () => {
      const db = {
        user: { update: vi.fn().mockResolvedValue({}) },
      };

      const caller = createCaller({ db: db as never, session: memberSession });
      const result = await caller.user.updateProfile({ displayName: "New Name", bio: "New bio" });

      expect(result.success).toBe(true);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "member-1" },
        data: { displayName: "New Name", bio: "New bio" },
      });
    });

    it("rejects guest (UNAUTHORIZED)", async () => {
      const db = { user: { update: vi.fn() } };

      const caller = createCaller({ db: db as never, session: null });
      await expect(caller.user.updateProfile({ displayName: "X" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
