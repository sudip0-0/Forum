ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_parentId_fkey";
ALTER TABLE "Thread" DROP CONSTRAINT IF EXISTS "Thread_categoryId_fkey";
DROP INDEX IF EXISTS "Category_parentId_idx";
DROP INDEX IF EXISTS "Thread_categoryId_lastActivityAt_idx";

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Section" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Forum" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Forum_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "postId" TEXT,
  "threadId" TEXT,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Section" ("id", "name", "slug", "description", "sortOrder", "updatedAt")
VALUES ('legacy-section', 'Community', 'community', 'Migrated forum section.', 0, CURRENT_TIMESTAMP);

ALTER TABLE "Category" ADD COLUMN "sectionId" TEXT;
UPDATE "Category" SET "sectionId" = 'legacy-section' WHERE "sectionId" IS NULL;
ALTER TABLE "Category" ALTER COLUMN "sectionId" SET NOT NULL;
ALTER TABLE "Category" DROP COLUMN IF EXISTS "parentId";

ALTER TABLE "Thread" ADD COLUMN "forumId" TEXT;
INSERT INTO "Forum" ("id", "categoryId", "name", "slug", "description", "sortOrder", "updatedAt")
SELECT
  'forum-' || "id",
  "id",
  "name",
  "slug",
  "description",
  "sortOrder",
  CURRENT_TIMESTAMP
FROM "Category";
UPDATE "Thread" t
SET "forumId" = 'forum-' || t."categoryId"
WHERE t."forumId" IS NULL;
ALTER TABLE "Thread" ALTER COLUMN "forumId" SET NOT NULL;
ALTER TABLE "Thread" DROP COLUMN IF EXISTS "categoryId";

CREATE UNIQUE INDEX "Section_slug_key" ON "Section"("slug");
CREATE INDEX "Section_sortOrder_idx" ON "Section"("sortOrder");
CREATE INDEX "Section_isPublic_sortOrder_idx" ON "Section"("isPublic", "sortOrder");
CREATE UNIQUE INDEX "Forum_slug_key" ON "Forum"("slug");
CREATE INDEX "Forum_categoryId_idx" ON "Forum"("categoryId");
CREATE INDEX "Forum_sortOrder_idx" ON "Forum"("sortOrder");
CREATE INDEX "Forum_isPublic_sortOrder_idx" ON "Forum"("isPublic", "sortOrder");
CREATE INDEX "Reaction_postId_idx" ON "Reaction"("postId");
CREATE INDEX "Reaction_threadId_idx" ON "Reaction"("threadId");
CREATE UNIQUE INDEX "Reaction_userId_postId_emoji_key" ON "Reaction"("userId", "postId", "emoji");
CREATE UNIQUE INDEX "Reaction_userId_threadId_emoji_key" ON "Reaction"("userId", "threadId", "emoji");
CREATE INDEX "Category_sectionId_idx" ON "Category"("sectionId");
CREATE INDEX "Thread_forumId_lastActivityAt_idx" ON "Thread"("forumId", "lastActivityAt");

ALTER TABLE "Category" ADD CONSTRAINT "Category_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Forum" ADD CONSTRAINT "Forum_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
