import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { appRouter } from "@/server/api/root";
import { hashPassword } from "@/server/auth/password";

const runIntegration = process.env.RUN_INTEGRATION === "1";

describe.skipIf(!runIntegration)("thread router integration", () => {
  const db = new PrismaClient();
  const suffix = Date.now().toString(36);
  let memberId = "";
  let forumId = "";
  let categoryId = "";

  beforeAll(async () => {
    const passwordHash = await hashPassword("Password123");
    const section = await db.section.create({
      data: {
        name: `Int Section ${suffix}`,
        slug: `int-section-${suffix}`,
        isPublic: true,
      },
    });
    const category = await db.category.create({
      data: {
        sectionId: section.id,
        name: `Int Category ${suffix}`,
        slug: `int-category-${suffix}`,
        isPublic: true,
      },
    });
    categoryId = category.id;
    const forum = await db.forum.create({
      data: {
        categoryId: category.id,
        name: `Int Forum ${suffix}`,
        slug: `int-forum-${suffix}`,
        isPublic: true,
      },
    });
    forumId = forum.id;
    const member = await db.user.create({
      data: {
        email: `int-member-${suffix}@example.com`,
        username: `intmember${suffix}`,
        passwordHash,
        role: "MEMBER",
        emailVerified: new Date(),
      },
    });
    memberId = member.id;
  });

  afterAll(async () => {
    await db.reaction.deleteMany({ where: { userId: memberId } });
    await db.post.deleteMany({ where: { authorId: memberId } });
    await db.thread.deleteMany({ where: { authorId: memberId } });
    await db.forum.deleteMany({ where: { id: forumId } });
    await db.category.deleteMany({ where: { id: categoryId } });
    await db.section.deleteMany({ where: { slug: { startsWith: `int-section-${suffix}` } } });
    await db.user.deleteMany({ where: { id: memberId } });
    await db.$disconnect();
  });

  it("creates a thread as a member and rejects guests", async () => {
    const memberCaller = appRouter.createCaller({
      db,
      session: {
        user: {
          id: memberId,
          email: `int-member-${suffix}@example.com`,
          name: "Int Member",
          role: "MEMBER",
          isSuspended: false,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      },
    });

    const thread = await memberCaller.thread.create({
      forumId,
      title: `Integration thread ${suffix}`,
      content: "This is an integration test body with enough length.",
      tags: [],
    });
    expect(thread.slug).toContain("integration-thread");

    const guestCaller = appRouter.createCaller({ db, session: null });
    await expect(
      guestCaller.thread.create({
        forumId,
        title: `Guest thread ${suffix}`,
        content: "This should be rejected for guests creating threads.",
        tags: [],
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
