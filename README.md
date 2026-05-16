# Forum

Next.js forum MVP scaffold.

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
The Docker PostgreSQL service is exposed on `localhost:5433` to avoid conflicts with local PostgreSQL installs that use `5432`.
Mailpit captures local auth emails so verification and password-reset links can be tested without sending real mail.

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
| PostgreSQL | `localhost:5433` |
| Redis | `localhost:6379` |
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
