DROP INDEX IF EXISTS "Reaction_userId_postId_emoji_key";
DROP INDEX IF EXISTS "Reaction_userId_threadId_emoji_key";

CREATE UNIQUE INDEX "Reaction_userId_postId_key" ON "Reaction"("userId", "postId");
CREATE UNIQUE INDEX "Reaction_userId_threadId_key" ON "Reaction"("userId", "threadId");
