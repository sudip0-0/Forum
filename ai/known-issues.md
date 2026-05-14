# Forum Website - Known Issues and Risks

## Open Issues

| ID | Severity | Area | Issue | Status | Owner | Next Action |
|---|---|---|---|---|---|---|
| KI-001 | Medium | Scope | Original product scope includes too many post-MVP features | Open | coordinator | Keep MVP frozen |
| KI-002 | Medium | Architecture | Real-time approach must be aligned before implementation | Open | architect | Use no real-time in MVP, SSE later |
| KI-003 | Medium | Search | Meilisearch adds infrastructure complexity | Open | backend | Start with PostgreSQL search |
| KI-004 | High | Security | Markdown rendering can introduce XSS | Resolved | security | react-markdown escapes all raw HTML by default |
| KI-005 | Medium | Progress | Existing progress logs may imply implementation already happened | Open | coordinator | Verify repo state before marking tasks done |
| KI-008 | Low | Code | `slugify` helper duplicated in category.ts and thread.ts | Open | backend | Extract to src/lib/slug.ts in next refactor |
| KI-009 | Low | Code | `createCaller` helper duplicated in 4 server action files | Open | backend | Extract to shared utility in next refactor |
| KI-010 | Low | Architecture | Category softDelete conflates visibility with deletion (isPublic=false) | Open | architect | Document as intentional or add isDeleted field to Category |
| KI-011 | Low | Search | No GIN indexes on tsvector columns — search slow at scale | Open | backend | Add migration with GIN indexes before public launch |
| KI-012 | Low | UX | Header uses useSession causing brief flash of unauthenticated state | Open | frontend | Pass session from server layout as prop |

## Deferred Features

Do not implement until MVP passes staging:

- OAuth providers
- real-time notifications
- email digests
- reputation
- badges
- reactions
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
