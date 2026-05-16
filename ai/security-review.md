# Forum MVP Security Review

**Task ID:** SEC-001  
**Date:** 2026-05-16  
**Reviewer:** agent-security  
**Status:** Ready for human approval

## Review Scope

This review covered authentication, authorization, moderation, user-generated content, public content visibility, password reset and email verification tokens, error handling, secrets hygiene, and rate limiting for the Forum MVP before staging.

The review verified:

- All user/content/admin mutations require server-side authentication.
- Moderator and admin actions have role checks.
- User content edit/delete paths enforce ownership.
- Suspended users cannot create threads, reply, report, react, update profile, or mutate owned content.
- Unverified users cannot create threads, reply, or report content.
- Deleted, hidden, and private content is filtered from public pages and search.
- Markdown rendering sanitizes raw HTML and dangerous links.
- Email verification and password reset tokens expire and are single-use.
- Sensitive error messages are normalized where exposed to users.
- No live secrets are committed.
- Current rate limiting behavior and production gaps are documented.

## Files Reviewed

- `ai/security.md`
- `ai/product.md`
- `ai/architecture.md`
- `ai/tasks.md`
- `ai/progress.md`
- `ai/known-issues.md`
- `ai/decisions.md`
- `prisma/schema.prisma`
- `src/server/auth/**`
- `src/server/api/trpc.ts`
- `src/server/api/rate-limit.ts`
- `src/server/api/routers/thread.ts`
- `src/server/api/routers/post.ts`
- `src/server/api/routers/user.ts`
- `src/server/api/routers/moderation.ts`
- `src/server/api/routers/search.ts`
- `src/server/api/routers/reaction.ts`
- `src/server/api/routers/category.ts`
- `src/server/api/routers/section.ts`
- `src/server/api/routers/forum.ts`
- `src/components/forum/markdown.tsx`
- `src/components/forum/markdown-editor.tsx`
- `src/app/(auth)/**`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/admin/**/*`
- `src/app/(public)/**/actions.ts`

## Findings

### SEC-001-F1

- **Severity:** Medium
- **Area:** Public content visibility
- **Description:** `post.listByThread` accepted a raw `threadId` and returned non-deleted posts without first verifying that the parent thread and forum/category/section were public and not deleted.
- **Exploit scenario:** An attacker who learned or guessed a thread ID for hidden/deleted content could call the public post-list procedure directly and read its posts.
- **Recommended fix:** Look up the parent thread, require `isDeleted=false` and public forum/category/section visibility before querying posts.
- **Status:** Fixed

### SEC-001-F2

- **Severity:** Medium
- **Area:** Moderation reporting visibility
- **Description:** `moderation.report` checked only target post/thread deletion state. It did not verify that reported content belonged to a public visible thread hierarchy.
- **Exploit scenario:** A member with a hidden post or thread ID could create reports against hidden content and expose metadata/content into moderation workflows unexpectedly.
- **Recommended fix:** Include parent thread/forum/category/section in report target lookups and return `NOT_FOUND` when the target is not publicly visible.
- **Status:** Fixed

### SEC-001-F3

- **Severity:** Medium
- **Area:** Admin user management
- **Description:** `moderation.suspendUser` allowed `MODERATOR` and `ADMIN`, while user management is an admin-only product requirement. It also lacked a last-active-admin guard.
- **Exploit scenario:** A compromised moderator account could suspend ordinary users, or an admin could accidentally suspend the final active admin and lock the forum out of administration.
- **Recommended fix:** Restrict suspension to admins and block suspending the last active admin.
- **Status:** Fixed

### SEC-001-F4

- **Severity:** Low
- **Area:** Suspended-account controls
- **Description:** Suspended users were blocked from creating, replying, reporting, reacting, and editing/deleting owned content, but could still update profile fields.
- **Exploit scenario:** A suspended user could continue changing public display name or bio after enforcement.
- **Recommended fix:** Enforce `assertNotSuspended` in `user.updateProfile`.
- **Status:** Fixed

### SEC-001-F5

- **Severity:** Medium
- **Area:** Rate limiting
- **Description:** Rate limits are in-memory and are bypassed when `E2E=true`. They do not work across multiple server instances and reset on process restart.
- **Exploit scenario:** In production with multiple app instances, an attacker could distribute login, registration, search, posting, or report attempts across instances and exceed intended limits.
- **Recommended fix:** Replace the in-memory store with Redis-backed counters before public launch, using the existing Redis service as the persistence layer.
- **Status:** Deferred

### SEC-001-F6

- **Severity:** Low
- **Area:** Account enumeration
- **Description:** Registration returns explicit duplicate email and username validation errors. Password reset and verification resend responses are generic.
- **Exploit scenario:** An attacker can use the registration form to determine whether an email address is already registered.
- **Recommended fix:** For a higher-risk public deployment, make registration responses generic or add stronger abuse monitoring/rate limits. MVP accepts this with registration rate limiting.
- **Status:** Deferred

### SEC-001-F7

- **Severity:** Low
- **Area:** Session freshness
- **Description:** JWT session claims include role and suspension status from login time. Server mutations enforce suspension for many paths using the session claim, so role/suspension changes may require session refresh or re-login to fully reflect in active sessions.
- **Exploit scenario:** A user suspended after logging in may keep an old token until it refreshes if a mutation relies only on session claims.
- **Recommended fix:** For production hardening, fetch fresh user status in protected mutation middleware or add a short JWT max age/session invalidation strategy.
- **Status:** Deferred

## Fixed Findings

- Fixed `post.listByThread` to return `NOT_FOUND` unless the parent thread and full forum hierarchy are visible.
- Fixed `moderation.report` to reject hidden/deleted post and thread targets.
- Restricted user suspension to admins and blocked suspending the last active admin.
- Blocked suspended users from profile updates.
- Added regression coverage for each fixed issue.

## Deferred Findings

- Redis-backed rate limiting remains required before public production launch. The existing Redis service is available, but the app currently uses an in-memory `Map` in `src/server/api/rate-limit.ts`.
- Registration still exposes duplicate email/username state. This is accepted for MVP with rate limits, but should be reconsidered for a public, adversarial launch.
- Session claims are not force-refreshed after role or suspension changes. This should be revisited with a production session invalidation plan.

## Test Coverage

Existing coverage reviewed:

- Password hashing and validation tests in `src/server/auth/password.test.ts`.
- Email verification token expiry and single-use tests in `src/server/auth/email-verification.test.ts`.
- Password reset token expiry and single-use tests in `src/server/auth/password-reset.test.ts`.
- Permission helper tests in `src/server/auth/permissions.test.ts`.
- Markdown XSS tests in `src/components/forum/markdown.test.ts`.
- Thread, post, user, search, reaction, and moderation router tests.
- Playwright E2E coverage for registration, verification, password reset, login/logout, thread/reply, report/moderation, admin, navigation, search, and mobile-sensitive flows.

New regression coverage added:

- `post.listByThread` rejects hidden thread hierarchies.
- `moderation.report` rejects hidden post and thread targets.
- `moderation.suspendUser` rejects moderators and blocks suspending the last active admin.
- `user.updateProfile` rejects suspended users.

Checks run:

- `pnpm exec vitest run src/server/api/routers/post.test.ts src/server/api/routers/moderation.test.ts src/server/api/routers/user.test.ts` passed: 77 tests.
- `pnpm test` passed: 305 tests.
- `pnpm test:e2e` passed: 41 tests.

## Final Recommendation

SEC-001 is ready for human approval. No Critical findings remain open. No High findings remain open. Medium production risks are documented and should be addressed before public production launch, especially Redis-backed rate limiting. The MVP is acceptable for staging from a security-review standpoint.
