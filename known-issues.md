# Forum Website — Known Issues and Risks

## Open Issues

| ID | Severity | Area | Issue | Status | Owner | Next Action |
|---|---|---|---|---|---|---|
| KI-001 | Medium | Scope | Original product scope includes too many post-MVP features | Open | coordinator | Keep MVP frozen |
| KI-002 | Medium | Architecture | Real-time approach must be aligned before implementation | Open | architect | Use no real-time in MVP, SSE later |
| KI-003 | Medium | Search | Meilisearch adds infrastructure complexity | Open | backend | Start with PostgreSQL search |
| KI-004 | High | Security | Markdown rendering can introduce XSS | Open | security | Add sanitization and tests |
| KI-005 | Medium | Progress | Existing progress logs may imply implementation already happened | Open | coordinator | Verify repo state before marking tasks done |

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
| None | — | — |
