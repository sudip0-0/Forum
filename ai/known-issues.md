# Forum Website - Known Issues and Risks

## Open Issues

| ID | Severity | Area | Issue | Status | Owner | Next Action |
|---|---|---|---|---|---|---|
| KI-001 | Medium | Scope | Original product scope includes too many post-MVP features | Open | coordinator | Keep MVP frozen |
| KI-002 | Medium | Architecture | Real-time approach must be aligned before implementation | Open | architect | Use no real-time in MVP, SSE later |
| KI-003 | Medium | Search | Meilisearch adds infrastructure complexity | Resolved | backend | Dual-path: Meilisearch when configured, PostgreSQL FTS + ts_rank fallback |
| KI-004 | High | Security | Markdown rendering can introduce XSS | Resolved | security | react-markdown escapes all raw HTML by default |
| KI-005 | Medium | Progress | Existing progress logs may imply implementation already happened | Resolved | coordinator | Docs now audited and synced to actual repo state (2026-05-15) |
| KI-010 | Low | Architecture | Category softDelete conflates visibility with deletion (isPublic=false) | Resolved | architect | Hierarchy soft-delete now uses `isDeleted` on Section/Category/Forum |

## Deferred Features

Do not implement until MVP passes staging:

- OAuth providers
- real-time notifications
- email digests
- reputation
- badges
- accepted solutions
- file uploads
- private messaging
- advanced analytics
- federation
- AI suggestions

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---:|---:|---|
| Scope creep | High | High | Use tasks.md as source of truth |
| Agent drift | High | Medium | Use agent-rules.md and reviewer loop |
| Auth bug | Medium | High | Security review and E2E tests |
| XSS via Markdown | Medium | High | Sanitize and test malicious input |
| Poor mobile UX | Medium | Medium | Add 375px E2E journey |
| Search delay | Medium | Medium | Start simple with PostgreSQL |
| Database schema churn | Medium | Medium | Finish data model before UI-heavy work |

## Resolved Issues

| ID | Date | Resolution |
|---|---|---|
| KI-006 | 2026-05-14 | Docker Desktop is running; `docker compose ps` shows Postgres and Redis healthy. |
| KI-007 | 2026-05-14 | Docker Postgres was remapped to host port `5433`; migration and seed now pass with `DATABASE_URL=postgresql://forum:forum@localhost:5433/forum_dev`. |
| KI-008 | 2026-05-15 | `slugify` extracted to `src/lib/slug.ts`. Was duplicated in 4 files (category.ts, thread.ts, forum.ts, section.ts); all updated to import from shared module. |
| KI-009 | 2026-05-15 | `createCaller` extracted to `src/server/api/caller.ts`. Was duplicated across all server action files; all updated to import shared helper. |
| KI-011 | 2026-05-15 | GIN indexes on `to_tsvector('english', title)` (Thread) and `to_tsvector('english', content)` (Post) added via migration `20260515_gin_fts_indexes`. |
| KI-012 | 2026-05-15 | Header converted to accept `session` prop from server layout; `useSession` removed from header. `ClientShell` now reads session server-side and passes it down. |
| KI-013 | 2026-05-16 | Redis-backed fixed-window rate limiting added for login, registration, thread creation, replies, reports, search, verification resend, and password reset requests. Auth-sensitive actions fail closed when Redis is configured but unavailable; local/test fallback requires explicit memory mode. |
