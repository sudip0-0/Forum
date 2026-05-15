# Forum Website — Data Model Guide

## Entities

The database contains:

- User
- Account/session tables required by Auth.js
- Section (top-level grouping)
- Category (belongs to Section)
- Forum (belongs to Category)
- Thread (belongs to Forum)
- Post
- Tag
- Reaction
- Report
- ModerationLog

## Entity Relationships

```txt
Section 1 ── * Category
Category 1 ── * Forum
Forum 1 ── * Thread
User 1 ── * Thread
User 1 ── * Post
Thread 1 ── * Post
Post 1 ── * Post replies (self-referential, max 3 levels enforced)
Thread * ── * Tag
User 1 ── * Reaction
Reaction * ── 1 Post or Thread
User 1 ── * Report
Report * ── 1 Post or Thread
ModerationLog * ── 1 Moderator
```

**Note:** The hierarchy is Section → Category → Forum → Thread, not the flat Category → Thread documented in earlier versions. This three-tier structure allows grouping forums under categories and categories under sections.

## Schema Rules

1. Use `cuid()` or `uuid()` IDs consistently.
2. Use unique slugs for categories and threads.
3. Use soft delete for user-generated content.
4. Never hard delete moderated content without audit requirements.
5. Add indexes for list pages and lookup routes.
6. Keep content source and rendered HTML separate only if rendering cache is needed.
7. Store user roles as enum.
8. Put business constraints in both validation and database where possible.

## Prisma Models (current — as implemented)

The schema is in `prisma/schema.prisma`. Key design choices:

- Three-tier forum hierarchy: Section → Category → Forum → Thread
- `isSuspended` on User controls posting rights without changing role
- `Reaction` has unique constraints per (userId, postId) and (userId, threadId)
- GIN indexes on `to_tsvector` for Thread.title and Post.content (for full-text search performance)
- Soft delete via `isDeleted` on Thread and Post; Category/Section/Forum use `isPublic=false` for hiding

```prisma
// Hierarchy: Section → Category → Forum → Thread

model Section {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  sortOrder   Int      @default(0)
  isPublic    Boolean  @default(true)
  isLocked    Boolean  @default(false)
  categories  Category[]
}

model Category {
  id          String   @id @default(cuid())
  sectionId   String
  name        String
  slug        String   @unique
  description String?
  sortOrder   Int      @default(0)
  isPublic    Boolean  @default(true)
  isLocked    Boolean  @default(false)
  section     Section  @relation(...)
  forums      Forum[]
}

model Forum {
  id          String   @id @default(cuid())
  categoryId  String
  name        String
  slug        String   @unique
  description String?
  sortOrder   Int      @default(0)
  isPublic    Boolean  @default(true)
  isLocked    Boolean  @default(false)
  category    Category @relation(...)
  threads     Thread[]
}

model Thread {
  id             String   @id @default(cuid())
  forumId        String
  authorId       String
  title          String
  slug           String   @unique
  isPinned       Boolean  @default(false)
  isLocked       Boolean  @default(false)
  isDeleted      Boolean  @default(false)
  replyCount     Int      @default(0)
  viewCount      Int      @default(0)
  lastActivityAt DateTime @default(now())
  // GIN index on to_tsvector('english', title)
}

model Post {
  id        String  @id @default(cuid())
  threadId  String
  authorId  String
  parentId  String? // max nesting depth: 3 levels enforced in post.create
  content   String
  isDeleted Boolean @default(false)
  // GIN index on to_tsvector('english', content)
}

model Reaction {
  id       String  @id @default(cuid())
  userId   String
  postId   String?
  threadId String?
  emoji    String  // enum: LIKE | HELPFUL | LAUGH | INSIGHTFUL
  @@unique([userId, postId])
  @@unique([userId, threadId])
}

model Tag {
  id      String   @id @default(cuid())
  name    String   @unique
  slug    String   @unique
  threads Thread[]
}

model Report {
  id         String       @id @default(cuid())
  reporterId String
  postId     String?
  threadId   String?
  reason     ReportReason
  status     ReportStatus @default(OPEN)
  @@unique([reporterId, postId])
  @@unique([reporterId, threadId])
}

model ModerationLog {
  id           String  @id @default(cuid())
  moderatorId  String
  targetUserId String?
  postId       String?
  threadId     String?
  action       String
  reason       String?
  metadata     Json?
}
```

## Indexing Requirements

Add indexes for:

- category thread lists
- user profile activity
- moderation queue
- search fallback
- slug lookups

## Seed Data Requirements

Seed should create:

- 1 admin
- 1 moderator
- 5 members
- 1+ sections
- 2+ categories per section
- 2+ forums per category
- 20+ threads spread across forums
- 60+ replies
- sample reports

## Data Safety Rules

- Use transactions for create thread + first post.
- Use transactions for moderation action + audit log.
- Do not expose deleted content to public users.
- Do not expose private user data on public profile pages.
