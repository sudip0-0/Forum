# Forum Website — Data Model Guide

## MVP Entities

The MVP database should focus on:

- User
- Account/session tables required by Auth.js
- Category
- Thread
- Post
- Tag
- Report
- ModerationLog

## Entity Relationships

```txt
User 1 ── * Thread
User 1 ── * Post
Category 1 ── * Thread
Thread 1 ── * Post
Post 1 ── * Post replies
Thread * ── * Tag
User 1 ── * Report
Report * ── 1 Post or Thread
ModerationLog * ── 1 Moderator
```

## Schema Rules

1. Use `cuid()` or `uuid()` IDs consistently.
2. Use unique slugs for categories and threads.
3. Use soft delete for user-generated content.
4. Never hard delete moderated content without audit requirements.
5. Add indexes for list pages and lookup routes.
6. Keep content source and rendered HTML separate only if rendering cache is needed.
7. Store user roles as enum.
8. Put business constraints in both validation and database where possible.

## MVP Prisma Models

Use this as the implementation target, but let the coding agent adapt it to Auth.js adapter requirements.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique
  displayName   String?
  passwordHash  String?
  image         String?
  bio           String?
  role          UserRole  @default(MEMBER)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  threads       Thread[]
  posts         Post[]
  reports       Report[]
}

enum UserRole {
  MEMBER
  MODERATOR
  ADMIN
}

model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?
  parentId    String?
  sortOrder   Int       @default(0)
  isPublic    Boolean   @default(true)
  isLocked    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  threads     Thread[]

  @@index([parentId])
  @@index([sortOrder])
}

model Thread {
  id              String   @id @default(cuid())
  categoryId      String
  authorId        String
  title           String
  slug            String   @unique
  isPinned        Boolean  @default(false)
  isLocked        Boolean  @default(false)
  isDeleted       Boolean  @default(false)
  replyCount      Int      @default(0)
  viewCount       Int      @default(0)
  lastActivityAt  DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  category        Category @relation(fields: [categoryId], references: [id])
  author          User     @relation(fields: [authorId], references: [id])
  posts           Post[]
  tags            Tag[]

  @@index([categoryId, lastActivityAt])
  @@index([authorId])
  @@index([isDeleted, isPinned])
}

model Post {
  id          String   @id @default(cuid())
  threadId    String
  authorId    String
  parentId    String?
  content     String
  isDeleted   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  thread      Thread   @relation(fields: [threadId], references: [id], onDelete: Cascade)
  author      User     @relation(fields: [authorId], references: [id])
  parent      Post?    @relation("PostReplies", fields: [parentId], references: [id])
  replies     Post[]   @relation("PostReplies")

  @@index([threadId, createdAt])
  @@index([parentId])
  @@index([authorId])
}

model Tag {
  id      String   @id @default(cuid())
  name    String   @unique
  slug    String   @unique
  threads Thread[]
}

model Report {
  id          String       @id @default(cuid())
  reporterId  String
  postId      String?
  threadId    String?
  reason      ReportReason
  note        String?
  status      ReportStatus @default(OPEN)
  createdAt   DateTime     @default(now())
  resolvedAt  DateTime?

  reporter    User         @relation(fields: [reporterId], references: [id])

  @@index([status, createdAt])
  @@index([postId])
  @@index([threadId])
}

enum ReportReason {
  SPAM
  HARASSMENT
  OFF_TOPIC
  DUPLICATE
  OTHER
}

enum ReportStatus {
  OPEN
  RESOLVED
  DISMISSED
}

model ModerationLog {
  id           String   @id @default(cuid())
  moderatorId  String
  targetUserId String?
  postId       String?
  threadId     String?
  action       String
  reason       String?
  metadata     Json?
  createdAt    DateTime @default(now())

  @@index([moderatorId])
  @@index([targetUserId])
  @@index([createdAt])
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
- 5 categories
- 20 threads
- 60 replies
- sample reports

## Data Safety Rules

- Use transactions for create thread + first post.
- Use transactions for moderation action + audit log.
- Do not expose deleted content to public users.
- Do not expose private user data on public profile pages.
