# Forum Website — Testing Strategy

## Testing Goal

Tests should prove that the forum works, not just that files execute.

Focus on:

- auth
- permissions
- thread creation
- replies
- search
- moderation
- security-sensitive behavior

## Testing Pyramid

```txt
Unit tests: helpers and business rules
Integration tests: tRPC + database behavior
E2E tests: full user journeys
Security tests: auth, XSS, permissions, secrets
```

## Unit Tests

Use Vitest.

Test:

- slug generation
- unique slug collision helper
- permission helpers
- markdown sanitization
- Zod schema validation
- pagination helpers

Example test targets:

```txt
src/lib/slug.ts
src/server/auth/permissions.ts
src/lib/markdown.ts
src/server/api/routers/thread.ts
```

## Integration Tests

Test tRPC routers with a real Postgres database.

Run with Docker Compose Postgres available:

```bash
RUN_INTEGRATION=1 pnpm test
```

Seeded integration coverage includes:

1. Create thread as member (`thread.integration.test.ts`).
2. Block thread creation as guest.

Expand further with moderation / soft-delete cases as needed. Unit tests continue to use mocked Prisma.

## E2E Tests

Use Playwright.

Required journeys:

### Auth Journey

```txt
register → login → access protected page → logout
```

### Forum Journey

```txt
login → open category → create thread → view thread → reply
```

### Search Journey

```txt
create thread → search title → open result
```

### Moderation Journey

```txt
member reports post → moderator opens queue → resolves report → audit log updated
```

### Mobile Journey

Run forum journey at 375px width.

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## CI Quality Gate

Merge is blocked if:

- lint fails
- typecheck fails
- build fails
- critical E2E test fails
- auth or moderation tests fail
- high or critical security issue exists

## Coverage Target

Minimum target:

| Area | Target |
|---|---:|
| `src/lib` | 80% |
| `src/server/auth` | 80% |
| `src/server/api/routers` | 70% |
| UI components | test only complex behavior |

## Test Data Rules

- Do not rely on production data.
- Seed predictable users.
- Reset database before E2E run.
- Use separate test database.

## Regression Rule

Every bug fix must include a regression test unless impossible.

If a regression test is skipped, document why in `known-issues.md`.
