# Forum

Next.js forum MVP scaffold.

Planning and engineering docs live under [`ai/`](ai/), including [architecture](ai/architecture.md), [security](ai/security.md), [testing](ai/testing.md), and the [release checklist](ai/release-checklist.md).

## Requirements

- Node.js LTS
- pnpm
- Docker Desktop

## Setup

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The app runs at `http://localhost:3000`.
Docker maps PostgreSQL to `localhost:5434` and Redis to `localhost:6380` (avoids clashes with other local stacks).
Mailpit captures local auth emails so verification and password-reset links can be tested without sending real mail.
Redis backs rate limiting when `REDIS_URL` is set. For local tests or development without Redis, set `RATE_LIMIT_BACKEND=memory`; production should use Redis and keep `RATE_LIMIT_IN_MEMORY_FALLBACK=false`.

### Seed accounts

After `pnpm db:seed` (password for all: `password123`):

| Role | Email |
|---|---|
| Admin | `admin@example.com` |
| Moderator | `moderator@example.com` |
| Member | `member1@example.com` … `member5@example.com` |
| Unverified | `unverified@example.com` |
| Suspended | `suspended@example.com` |

## Optional Search Service

Meilisearch is included for later work but is not started by default.

```bash
docker compose --profile search up -d
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Local Services

| Service | URL |
|---|---|
| App | `http://localhost:3000` |
| PostgreSQL | `localhost:5434` |
| Redis | `localhost:6380` |
| Mailpit SMTP | `localhost:1025` |
| Mailpit inbox | `http://localhost:8025` |
| Meilisearch | `http://localhost:7700` |

## Local Email Testing

Local email delivery uses the SMTP provider configured in `.env`:

```bash
EMAIL_PROVIDER=smtp
EMAIL_FROM="Forum <no-reply@example.com>"
APP_URL=http://localhost:3000
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

After `docker compose up -d`, registration verification and password-reset emails are delivered to Mailpit. Open the Mailpit inbox at `http://localhost:8025` to inspect messages and follow the links.
