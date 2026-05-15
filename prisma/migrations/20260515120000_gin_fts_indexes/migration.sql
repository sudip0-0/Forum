-- GIN indexes for full-text search on Thread title and Post content.
-- These allow PostgreSQL to use pre-built tsvector indexes rather than
-- computing to_tsvector() on every row at query time, making search
-- significantly faster as data grows.
--
-- Note: CREATE INDEX CONCURRENTLY cannot run inside a transaction (which
-- Prisma migrate uses). The non-concurrent form below locks the table
-- briefly on a small dataset. On a large production database, run the
-- CONCURRENTLY variant manually during a maintenance window instead:
--
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "Thread_title_fts_idx"
--     ON "Thread" USING GIN (to_tsvector('english', title));
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "Post_content_fts_idx"
--     ON "Post" USING GIN (to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS "Thread_title_fts_idx"
  ON "Thread" USING GIN (to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS "Post_content_fts_idx"
  ON "Post" USING GIN (to_tsvector('english', content));
