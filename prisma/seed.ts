import { PrismaClient, ReportReason, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const demoPasswordHash = "dev-only-password-hash-placeholder";

async function main() {
  await prisma.moderationLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.post.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      username: "admin",
      displayName: "Admin User",
      passwordHash: demoPasswordHash,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  const moderator = await prisma.user.create({
    data: {
      email: "moderator@example.com",
      username: "moderator",
      displayName: "Moderator User",
      passwordHash: demoPasswordHash,
      role: UserRole.MODERATOR,
      emailVerified: new Date(),
    },
  });

  const members = await Promise.all(
    Array.from({ length: 5 }, (_, index) =>
      prisma.user.create({
        data: {
          email: `member${index + 1}@example.com`,
          username: `member${index + 1}`,
          displayName: `Member ${index + 1}`,
          passwordHash: demoPasswordHash,
          role: UserRole.MEMBER,
          bio: "Seeded forum member for local development.",
          emailVerified: new Date(),
        },
      }),
    ),
  );

  const categories = await Promise.all(
    [
      ["General Discussion", "Questions and discussion that do not fit elsewhere."],
      ["Support", "Get help from the community."],
      ["Showcase", "Share projects, launches, and demos."],
      ["Development", "Technical implementation and architecture topics."],
      ["Meta", "Discuss the forum itself."],
    ].map(([name, description], index) =>
      prisma.category.create({
        data: {
          name,
          slug: slugify(name),
          description,
          sortOrder: index + 1,
        },
      }),
    ),
  );

  const tags = await Promise.all(
    ["nextjs", "postgres", "prisma", "help", "showcase"].map((name) =>
      prisma.tag.create({
        data: {
          name,
          slug: slugify(name),
        },
      }),
    ),
  );

  const authors = [admin, moderator, ...members];
  const threads = [];

  for (let index = 0; index < 20; index += 1) {
    const category = categories[index % categories.length];
    const author = authors[index % authors.length];
    const title = `Seed thread ${index + 1} in ${category.name}`;
    const createdAt = new Date(Date.now() - (20 - index) * 60 * 60 * 1000);

    const thread = await prisma.thread.create({
      data: {
        categoryId: category.id,
        authorId: author.id,
        title,
        slug: `${slugify(title)}-${index + 1}`,
        isPinned: index < 2,
        replyCount: 3,
        viewCount: 25 + index,
        createdAt,
        lastActivityAt: createdAt,
        tags: {
          connect: [
            { id: tags[index % tags.length].id },
            { id: tags[(index + 1) % tags.length].id },
          ],
        },
        posts: {
          create: {
            authorId: author.id,
            content: `This is the opening post for ${title}. It gives seeded content for local development and search testing.`,
            createdAt,
          },
        },
      },
    });

    threads.push(thread);
  }

  const firstPosts = await prisma.post.findMany({
    where: { parentId: null },
    orderBy: { createdAt: "asc" },
  });

  for (let threadIndex = 0; threadIndex < threads.length; threadIndex += 1) {
    const thread = threads[threadIndex];
    const firstPost = firstPosts[threadIndex];

    for (let replyIndex = 0; replyIndex < 3; replyIndex += 1) {
      const author = members[(threadIndex + replyIndex) % members.length];
      await prisma.post.create({
        data: {
          threadId: thread.id,
          authorId: author.id,
          parentId: replyIndex === 0 ? undefined : firstPost.id,
          content: `Reply ${replyIndex + 1} on ${thread.title}. This seeded reply helps exercise nested discussion data.`,
          createdAt: new Date(thread.createdAt.getTime() + (replyIndex + 1) * 10 * 60 * 1000),
        },
      });
    }
  }

  const reportedPost = await prisma.post.findFirstOrThrow({
    where: {
      authorId: { not: members[0].id },
    },
    orderBy: { createdAt: "asc" },
  });

  const reportedThread = threads[1];

  const postReport = await prisma.report.create({
    data: {
      reporterId: members[0].id,
      postId: reportedPost.id,
      reason: ReportReason.SPAM,
      note: "Seeded open post report.",
    },
  });

  await prisma.report.create({
    data: {
      reporterId: members[1].id,
      threadId: reportedThread.id,
      reason: ReportReason.OFF_TOPIC,
      note: "Seeded open thread report.",
    },
  });

  await prisma.moderationLog.create({
    data: {
      moderatorId: moderator.id,
      postId: reportedPost.id,
      action: "REPORT_CREATED",
      reason: "Seeded moderation log for local development.",
      metadata: {
        reportId: postReport.id,
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
