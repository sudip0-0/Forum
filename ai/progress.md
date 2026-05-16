# Forum Website Progress Tracker

**Version:** 1.2
**Status:** MVP Feature-Complete — Testing and Hardening Phase
**Owner:** Project Coordinator
**Last Updated:** 2026-05-16

## 1. Current State

| Item | Status |
|---|---|
| Product scope | MVP defined |
| Architecture | Build-ready architecture drafted |
| Task roadmap | Ordered roadmap created |
| Local repo | Confirmed |
| App scaffold | Done |
| Database migration | Implemented and applied locally |
| Auth | Email/password auth with NextAuth v5, bcryptjs hashing, real email verification, password reset, login/register/logout |
| Category CRUD | Done — public listing, admin CRUD, tRPC router with tests |
| Thread CRUD | Done — thread router, post router, category thread list, thread detail, reply form, 21 tests |
| Core forum | Done — all CORE tasks complete |
| Moderation | MOD-001/MOD-002/MOD-003 done — report, queue, resolve, user management, role change, suspend/unsuspend, thread actions, move thread, history log |
| Tests | 298 unit/integration tests across 28 test files; 8 Playwright E2E spec files covering auth, threads, search, moderation, navigation, filters, admin |
| Staging deploy | Not started |
| SEO / Polish | POL-001/POL-002/POL-003 done — metadata, sitemap (revalidate=3600, take:5000), header/nav, responsive, error/loading/404 |
| Post-MVP features | Reactions (ENG-001) and Tags implemented ahead of staging milestone |

## 2. Current Sprint

**Sprint:** 3 — Hardening and Optimization
**Goal:** Fix known issues, extract shared utilities, add GIN indexes, stabilise for staging.

### Active Tasks

| Task | Owner | Status | Notes |
|---|---|---|---|
| KI-008 fix | agent-backend | Done | Extracted `slugify` to `src/lib/slug.ts`; updated category, thread, forum, section routers |
| KI-009 fix | agent-backend | Done | Extracted `makeServerCaller` to `src/server/api/caller.ts`; updated all server action files |
| KI-011 fix | agent-backend | Done | Added GIN tsvector migration for Thread.title and Post.content |
| KI-012 fix | agent-frontend | Done | Header now receives session from server layout as prop; `useSession` removed |
| Post depth fix | agent-backend | Done | 3-level nesting enforced in `post.create` via parent chain walk |
| Sitemap fix | agent-frontend | Done | `/category/[slug]` pages added to sitemap |
| QA-003 | agent-qa | Done | Full Playwright E2E release gate stabilized; 41/41 tests passing locally |
| SEC-001 | agent-security | Done | Formal security review completed; no open Critical/High findings |

### Completed Sprints

| Task | Owner | Status | Notes |
|---|---|---|---|
| CORE-001 | agent-backend+frontend | Done | Category tRPC router, admin CRUD page, public listing page, 21 tests |
| CORE-002 | agent-backend+frontend | Done | Thread router (listByCategory, getBySlug, create), category thread list page, new thread page, 12 tests |
| CORE-003 | agent-backend+frontend | Done | Post router (listByThread, create), thread detail page with nested replies, reply form, 9 tests |
| CORE-004 | agent-frontend+security | Done | Markdown renderer (react-markdown + remark-gfm), MarkdownEditor with preview, XSS tests, 6 tests |
| CORE-005 | agent-frontend+backend | Done | User router (getPublicProfile, updateProfile), profile page at /u/[username], edit form, 4 tests |
| CORE-006 | agent-backend+frontend | Done | Search router (PostgreSQL full-text), search page at /search, 4 tests |
| INF-001 | agent-devops | Done | Scaffold reviewed and verified |
| INF-002 | agent-devops | Done | Docker Compose starts Postgres and Redis successfully |
| INF-003 | agent-backend | Done | Prisma schema, migration, and seed verified locally |
| INF-004 | agent-backend | Done | tRPC base setup with health router, protected procedure, role helper, error formatter |
| INF-005 | agent-security/backend/frontend | Done | NextAuth v5 with credentials, bcryptjs, login/register pages, protected /admin page, logout |

## 3. Daily Log Template

```md
## YYYY-MM-DD

### Completed
- 

### In Progress
- 

### Blockers
- 

### Decisions
- 

### Test Results
- 

### Next Steps
- 
```

## 4. Work Log

### 2026-05-14

### Completed
- Documentation pack improved for agentic build.
- MVP scope separated from post-MVP features.
- Build process, agent rules, prompt library, testing guide, and release checklist added.
- INF-001 scaffold implemented with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui configuration, ESLint, Prettier, and basic folder structure.
- Added a basic Vitest test for the shared class-name utility.
- Applied INF-001 reviewer fixes: removed unused ESLint compatibility dependency and ignored TypeScript incremental build artifacts.
- Added INF-002 local infrastructure files: Docker Compose, `.env.example`, and root README setup instructions.
- Added INF-003 Prisma schema, database scripts, seed script, and schema contract tests.
- Remapped Docker Postgres to host port `5433` to avoid an existing local PostgreSQL process on `5432`.
- Applied initial Prisma migration and seeded local development data.
- Reviewer re-check completed for INF-001 through INF-003; all required checks passed.
- CORE-001 implemented: category tRPC router (6 procedures), admin CRUD page at `/admin/categories`, public listing at `/forums`, 21 tests, all checks pass.
- CORE-002 implemented: thread router (listByCategory, getBySlug, create), category thread list page at `/forum/[categorySlug]`, new thread page at `/forum/[categorySlug]/new`, 12 tests.
- CORE-003 implemented: post router (listByThread, create), thread detail page at `/forum/[categorySlug]/[threadSlug]` with nested replies up to 3 levels, reply form, 9 tests.
- CORE-004 implemented: Markdown renderer (react-markdown + remark-gfm), MarkdownEditor with Write/Preview toggle, XSS sanitization tests, thread detail uses Markdown rendering.
- CORE-005 implemented: user router (getPublicProfile, updateProfile), profile page at `/u/[username]` with recent threads and edit form.
- CORE-006 implemented: search router with PostgreSQL full-text search, search page at `/search?q=`.
- POL-001 implemented: metadata exports on /forums, /search, /forum/[categorySlug], /forum/[categorySlug]/[threadSlug], /u/[username]; sitemap.ts at /sitemap.xml with public categories and non-deleted threads (excluding hidden categories).
- POL-002 implemented: shared Header component with desktop nav, mobile hamburger menu, auth-aware (login/register vs user+logout), SessionProvider wrapper; admin users table overflow-x-auto; button min-h-[44px] tap targets; input/select/textarea min-h-[44px] via globals.css.
- POL-003 implemented: global error.tsx error boundary with retry; not-found.tsx custom 404 page; (public)/loading.tsx skeleton loader; all list pages already had empty states; all mutation forms already showed errors.

### In Progress
- Batch 2 — Core Content Completeness: own-content editing and self-service soft delete.

### Latest Batch 2 Update
- Added ownership-scoped editing for thread title/original body and reply body.
- Added self-service soft delete for owned replies and zero-reply owned threads.
- Reply self-delete now decrements `replyCount`; deleted replies remain excluded from public reply lists.
- Thread detail UI now includes owner-only edit/delete controls, confirmation prompts, validation, loading, cancel, and blocked-delete messaging.
- Added router regression coverage plus E2E journey coverage for edit/delete flows.

### Blockers
- None.

### Decisions
- Thread creation uses sequential creates (thread then post) rather than interactive $transaction to avoid Prisma type issues.
- Slug collision handled by appending Date.now().toString(36) suffix.
- Post nesting depth validated by walking parent chain (max 3 levels).
- Markdown rendering uses react-markdown + remark-gfm (no raw HTML passthrough = XSS safe by default).
- Search uses PostgreSQL full-text search with to_tsvector/to_tsquery.

### Test Results
- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed (238 tests total, 22 files).
- `pnpm build` passed.
- `pnpm test:e2e` ran on 2026-05-16 after Docker came up: Batch 2 thread flows passed, but the full suite still had one unrelated existing failure in `e2e/navigation-and-filters.spec.ts` because the category page rendered two breadcrumb navs where that spec expects one.

### Next Steps
- Prepare staging deploy.
- Run full E2E suite against staging.
- Formal SEC-001 security review.

### 2026-05-16

### Completed
- Added provider-agnostic email service boundary with SMTP delivery and Mailpit local infrastructure.
- Replaced stubbed verification with expiring single-use verification tokens, verification UI, and safe resend flow.
- Added password reset request/completion flow with generic request responses and expiring single-use tokens.
- Blocked unverified users from creating threads, posting replies, and reporting content at the server layer.
- Implemented Batch 3 launch-readiness polish: clearer onboarding/empty states, accessibility fixes across core controls/forms, explicit robots/canonical metadata, and tighter public-profile visibility filtering.
- QA-003 completed: fixed remaining full Playwright E2E failures in moderation logout handoff and thread owner edit/delete coverage.
- Replaced brittle text selectors in affected E2E flows with accessible role selectors and explicit page-state waits.
- Changed thread owner edit refresh from `window.location.reload()` to `router.refresh()` and successful delete navigation from `router.push()` plus immediate refresh to `router.replace()`.
- Fixed a flaky thread-highlight property test that incorrectly expected overlapping substring matches; the tested contract now matches the non-overlapping browser-rendered highlight behavior.
- SEC-001 completed: created `ai/security-review.md` covering auth, authorization, moderation, UGC, tokens, content visibility, secrets, and rate limiting.
- Fixed security findings for hidden thread post listing, reporting hidden targets, moderator access to user suspension, last-active-admin suspension, and suspended profile updates.
- Added regression tests for the SEC-001 fixes.

### In Progress
- None.

### Blockers
- None.

### Decisions
- Reused the existing `VerificationToken` table with purpose-prefixed identifiers for verification and reset flows.
- Kept auth flows in server actions/App Router pages while leaving forum mutations in tRPC routers.
- Chose `noindex,follow` for search pages and MVP profile pages; kept public discovery focused on home/forums/category/forum/thread URLs.
- No tests were skipped or quarantined for QA-003.
- No open Critical or High security findings remain after SEC-001.

### Test Results
- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed (305 tests total, 28 files).
- Targeted `pnpm exec vitest run src/server/api/routers/post.test.ts src/server/api/routers/moderation.test.ts src/server/api/routers/user.test.ts` passed (77 tests).
- Targeted `pnpm exec playwright test e2e/moderation.spec.ts e2e/thread.spec.ts` passed (7 tests).
- Full `pnpm test:e2e` passed (41 tests).
- SEC-001 reran full `pnpm test:e2e` after security-sensitive router fixes; it passed (41 tests).
- Mailpit was started locally and confirmed healthy on port `8025`.
- Auth-focused E2E passed with Mailpit-backed verification and password-reset links (`6` tests).

### Failed Checks During QA-003
- Initial `pnpm test:e2e` failed in `e2e/moderation.spec.ts` because the test clicked Logout and immediately navigated to `/login`, racing NextAuth's own redirect.
- Initial `pnpm test:e2e` failed in `e2e/thread.spec.ts` edit coverage because a broad `h1` locator became ambiguous during thread refresh.
- Initial `pnpm test:e2e` failed in `e2e/thread.spec.ts` delete coverage because the client issued `router.push()` and an immediate `router.refresh()` after delete, making the redirect unreliable.
- A later `pnpm test` run exposed a flaky property in `src/lib/thread-highlight.test.ts` for overlapping matches such as content `ppp` and term `pp`.

### Remaining Risks
- Playwright still relies on local Mailpit at `localhost:8025` for auth email flows.
- Rate limiting is still in-memory and must be replaced with Redis-backed counters before public production launch (KI-013).
- Registration duplicate email/username responses and JWT claim freshness are documented as Low/Medium deferred findings in `ai/security-review.md`.

### Next Steps
- Prepare staging deploy.
- Run the same full quality gate against staging.
- Formal SEC-001 security review.

## 5. Blocker Log

| ID | Date | Task | Blocker | Owner | Resolution |
|---|---|---|---|---|---|
| BLK-001 | 2026-05-14 | Project | Local repo not yet confirmed | User | Resolved: project root confirmed at `C:\Users\sudip\Desktop\Projects\Forum` |
| BLK-002 | 2026-05-14 | INF-002 | Docker Desktop Linux engine is not running | User | Resolved: Docker services are running and healthy |
| BLK-003 | 2026-05-14 | INF-003 | Existing PostgreSQL listener rejects configured `forum` credentials | User | Resolved: Docker Postgres remapped to host port `5433`; migration and seed pass |

## 6. Decision Log Summary

Full records are in `decisions.md`.

| ID | Decision | Status |
|---|---|---|
| ADR-001 | Use Next.js modular monolith for MVP | Accepted |
| ADR-002 | Use PostgreSQL search before Meilisearch | Accepted |
| ADR-003 | Delay real-time until core forum is stable | Accepted |
| ADR-004 | Use AI task contracts for every implementation step | Accepted |

## 7. Review Queue

| Task | Implementation Summary | Reviewer | Status |
|---|---|---|---|
| None | - | - | - |

## 8. Completed Tasks

| Task | Date | Commit | Notes |
|---|---|---|---|
| INF-001 | 2026-05-14 | - | Next.js scaffold, tooling, Tailwind, shadcn/ui button, and checks verified |
| INF-002 | 2026-05-14 | - | Docker Compose local infrastructure verified with Postgres on `5433` and Redis on `6379` |
| INF-003 | 2026-05-14 | - | Prisma schema, migration, seed, and seed counts verified |
| INF-004 | 2026-05-14 | - | tRPC root router, context, public/protected/role procedures, error formatter, health router, API route handler |
| INF-005 | 2026-05-14 | - | NextAuth v5 credentials provider, bcryptjs password hashing, login/register/logout pages, protected /admin page, seed uses real hashes |
| CORE-001 | 2026-05-14 | - | Category tRPC router (6 procedures), admin CRUD at /admin/categories, public listing at /forums, 21 tests |
| CORE-002 | 2026-05-14 | - | Thread router (listByCategory, getBySlug, create), category thread list page, new thread page, 12 tests |
| CORE-003 | 2026-05-14 | - | Post router (listByThread, create), thread detail page with nested replies, reply form, 9 tests |
| CORE-004 | 2026-05-14 | - | Markdown renderer, MarkdownEditor with preview, XSS tests, updated thread/reply forms |
| CORE-005 | 2026-05-14 | - | User router, profile page at /u/[username], edit form, 4 tests |
| CORE-006 | 2026-05-14 | - | Search router (PostgreSQL full-text), search page at /search, 4 tests |
| MOD-001 | 2026-05-14 | - | Moderation router (report procedure), ReportForm client component, report buttons on thread detail, 12 tests |
| MOD-002 | 2026-05-14 | - | Moderation queue (listQueue, resolve), admin/mod page, 14 resolve/queue tests |
| POL-001 | 2026-05-14 | - | Metadata on all public pages, sitemap.ts at /sitemap.xml |
| POL-002 | 2026-05-14 | - | Header/nav with hamburger, responsive fixes (buttons, inputs, tables) |
| POL-003 | 2026-05-14 | - | error.tsx, not-found.tsx, (public)/loading.tsx |
| QA-003 | 2026-05-16 | - | Full Playwright E2E gate stabilized; lint, typecheck, unit/integration, and 41-test E2E suite passing |
| SEC-001 | 2026-05-16 | - | Formal security review completed; scoped server-side authorization fixes and 305-test unit/integration suite passing |

## 9. Metrics

Populate after working app exists.

| Metric | Target | Current |
|---|---:|---:|
| Build passing | Yes | Yes |
| Unit tests passing | Yes | Yes |
| E2E passing | Yes | Yes |
| Lighthouse mobile | > 90 | - |
| Search latency | < 300ms MVP | - |
| API p95 local | < 300ms | - |

## 10. Update Rules

Agents must update this file after every task.

Every update must include:

- What changed
- Files touched
- Checks run
- Failed checks
- Remaining risks
- Next recommended task
