# Forum Website — Improved Agent Task Roadmap

**Version:** 1.1  
**Status:** Build Ready  
**Rule:** Complete tasks in order unless a blocker is documented.

## Status Legend

| Status | Meaning |
|---|---|
| 🔲 Not Started | Ready but not assigned |
| 🔄 In Progress | Agent is working |
| ⏳ Review | Implementation complete, awaiting review |
| ✅ Done | Merged and verified |
| 🚫 Blocked | Cannot continue without fixing blocker |

## Task Contract Template

Every task must be run using this structure:

```txt
Task ID:
Goal:
Scope:
Files likely affected:
Files not to touch:
Acceptance criteria:
Checks to run:
Definition of done:
```

## Phase 0 — Project Foundation

### INF-001 — Create Next.js Project Scaffold

**Owner:** agent-devops  
**Status:** ✅ Done  
**Goal:** Create a clean Next.js TypeScript app with project tooling.

**Scope**
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui setup
- ESLint
- Prettier
- basic folder structure

**Files likely affected**
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/styles/globals.css`
- `components.json`

**Acceptance Criteria**
- `pnpm dev` runs successfully.
- Home page renders.
- Tailwind classes work.
- shadcn/ui can add a button component.
- No TypeScript errors.

**Checks**
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

### INF-002 — Add Local Infrastructure

**Owner:** agent-devops  
**Status:** ✅ Done  
**Goal:** Add local services for PostgreSQL and optional Redis/Meilisearch.

**Scope**
- `docker-compose.yml`
- Postgres service
- Redis service
- Meilisearch service kept optional
- `.env.example`

**Acceptance Criteria**
- `docker compose up -d` starts services.
- `.env.example` contains all local env keys.
- README setup commands work.

### INF-003 — Prisma Schema and Seed

**Owner:** agent-backend  
**Status:** ✅ Done  
**Goal:** Create the MVP database schema and seed demo data.

**Scope**
- Users
- Categories
- Threads
- Posts
- Tags
- Reports
- Moderation logs

**Acceptance Criteria**
- Migration runs.
- Seed creates admin, moderator, members, categories, threads, posts.
- Foreign keys are valid.
- Soft delete fields exist where needed.

**Checks**
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm test`

### INF-004 — tRPC Base Setup

**Owner:** agent-backend  
**Status:** 🔲 Not Started  
**Goal:** Add typed API layer.

**Scope**
- tRPC root router
- context with Prisma and session
- public procedure
- protected procedure
- role-based procedure helper
- error formatter

**Acceptance Criteria**
- Public health query works.
- Protected query returns unauthorized when logged out.
- Type inference works on client.

### INF-005 — Auth Foundation

**Owner:** agent-security + agent-backend + agent-frontend  
**Status:** 🔲 Not Started  
**Goal:** Implement email/password auth.

**Scope**
- Auth.js config
- credentials provider
- password hashing
- login page
- register page
- logout flow
- session helper

**Acceptance Criteria**
- User can register.
- User can log in.
- User can log out.
- Passwords are hashed.
- Protected page blocks guests.

## Phase 1 — Core Forum MVP

### CORE-001 — Category Listing and Admin Category CRUD

**Owner:** agent-backend + agent-frontend  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Guest sees public categories.
- Admin can create, edit, reorder, hide categories.
- Category slug is unique.
- Member cannot access admin category management.

### CORE-002 — Thread Creation and Category Thread List

**Owner:** agent-backend + agent-frontend  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Member can create a thread.
- Thread creates first post in one transaction.
- Thread appears in category list.
- Locked category blocks posting.
- Slug collision is handled.

### CORE-003 — Thread Detail and Replies

**Owner:** agent-backend + agent-frontend  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Thread page shows original post and replies.
- Member can reply.
- Reply appears after submit.
- Nested replies work up to 3 levels.
- Locked thread blocks new replies.

### CORE-004 — Markdown Editor and Renderer

**Owner:** agent-frontend + agent-security  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- User can write Markdown.
- Preview renders safely.
- Code blocks render correctly.
- Dangerous HTML is sanitized or rejected.

### CORE-005 — User Profiles

**Owner:** agent-frontend + agent-backend  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- `/u/[username]` shows profile and public activity.
- User can edit display name and bio.
- Private data is not exposed.

### CORE-006 — Basic Search

**Owner:** agent-backend + agent-frontend  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Search page accepts query param.
- Searches thread title and post content.
- Soft-deleted content is excluded.
- Empty search has useful state.

## Phase 2 — Moderation MVP

### MOD-001 — Report Content

**Owner:** agent-backend + agent-frontend  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Member can report post/thread.
- Duplicate reports from same user are blocked.
- Report creates queue item.

### MOD-002 — Moderation Queue

**Owner:** agent-backend + agent-frontend  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Moderator can view reports.
- Moderator can resolve, dismiss, soft delete, or lock.
- All actions create audit log entries.

### MOD-003 — Admin User Management

**Owner:** agent-backend + agent-frontend  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Admin can list users.
- Admin can change role.
- Admin cannot demote last admin.
- Role changes are logged.

## Phase 3 — SEO and Polish

### POL-001 — SEO Metadata and Sitemap

**Owner:** agent-frontend  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Thread pages have title and description metadata.
- Category pages have metadata.
- Sitemap includes public categories and threads.
- Soft-deleted threads are excluded.

### POL-002 — Responsive Mobile UX

**Owner:** agent-frontend  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Core pages work at 375px width.
- Forms are touch friendly.
- Header/nav is usable on mobile.
- No horizontal overflow.

### POL-003 — Empty, Loading, and Error States

**Owner:** agent-frontend  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Lists show empty states.
- Mutations show validation errors.
- Failed requests show useful message.
- Loading states do not shift layout badly.

## Phase 4 — Testing and Hardening

### QA-001 — Unit and Integration Tests

**Owner:** agent-qa  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Slug generation tested.
- Permission helpers tested.
- tRPC create thread tested.
- Report flow tested.

### QA-002 — Playwright E2E Tests

**Owner:** agent-qa  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Register/login/logout journey passes.
- Create thread/reply journey passes.
- Report/moderate journey passes.
- Search journey passes.

### SEC-001 — Security Review

**Owner:** agent-security  
**Status:** 🔲 Not Started

**Acceptance Criteria**
- Auth routes reviewed.
- All mutations have auth and authorization checks.
- XSS checks pass for markdown content.
- No secrets committed.
- Rate-limit plan documented.

## Phase 5 — Post-MVP Enhancements

Only start after MVP is deployed to staging.

| ID | Feature | Notes |
|---|---|---|
| ENG-001 | Voting and reactions | Add after post model is stable |
| ENG-002 | Accepted solutions | Good for Q&A forums |
| ENG-003 | Notifications | Start with polling, then SSE |
| ENG-004 | Subscriptions | Requires notification preferences |
| SRCH-002 | Meilisearch | Add after PostgreSQL search baseline |
| FILE-001 | Attachments | Requires upload security design |
| PERF-001 | Redis caching | Add after measuring bottlenecks |
| ADMIN-002 | Analytics dashboard | Add after events are tracked |

## Dependency Order

```txt
INF-001
  ↓
INF-002 + INF-003
  ↓
INF-004
  ↓
INF-005
  ↓
CORE-001
  ↓
CORE-002
  ↓
CORE-003 + CORE-004
  ↓
CORE-005 + CORE-006
  ↓
MOD-001 → MOD-002 → MOD-003
  ↓
POL-001 + POL-002 + POL-003
  ↓
QA-001 + QA-002 + SEC-001
```
