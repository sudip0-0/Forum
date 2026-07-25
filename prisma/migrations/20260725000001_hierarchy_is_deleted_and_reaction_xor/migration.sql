-- AlterTable
ALTER TABLE "Category" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Forum" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Category_isDeleted_idx" ON "Category"("isDeleted");

-- CreateIndex
CREATE INDEX "Section_isDeleted_idx" ON "Section"("isDeleted");

-- CreateIndex
CREATE INDEX "Forum_isDeleted_idx" ON "Forum"("isDeleted");

-- Reaction must target exactly one of post or thread
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_exactly_one_target_check"
CHECK (
  (("postId" IS NOT NULL AND "threadId" IS NULL) OR ("postId" IS NULL AND "threadId" IS NOT NULL))
);

-- Invalidate any plaintext auth tokens; new tokens are stored hashed
DELETE FROM "VerificationToken";
