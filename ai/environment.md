# Forum Website — Environment and Local Setup

## Required Tools

Install:

- Node.js LTS
- pnpm
- Docker Desktop
- Git
- VS Code or Cursor

Optional later:

- Vercel CLI
- Railway CLI
- Meilisearch CLI

## Local Setup Commands

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Recommended Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

Production DB connections should prefer PgBouncer. Example:

```env
DATABASE_URL=postgresql://forum:SECRET@pgbouncer:6432/forum?pgbouncer=true&connection_limit=5
```

App env is validated at boot via `src/server/env.ts`. In production, `AUTH_SECRET` must be ≥32 chars (not a placeholder), `REDIS_URL` is required, and `RATE_LIMIT_BACKEND=redis` with `RATE_LIMIT_IN_MEMORY_FALLBACK=false`.

## Environment Variables

Create `.env.example`:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://forum:forum@localhost:5434/forum_dev

# Auth
AUTH_SECRET=replace-with-local-secret
AUTH_URL=http://localhost:3000

# Optional OAuth later
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Rate limiting
REDIS_URL=redis://localhost:6380
RATE_LIMIT_BACKEND=redis
RATE_LIMIT_IN_MEMORY_FALLBACK=false

# Meilisearch later
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=local-master-key

# Email later
RESEND_API_KEY=
EMAIL_FROM=noreply@example.com

# Storage later
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=
```

## Docker Compose MVP

```yaml
services:
  postgres:
    image: postgres:16
    container_name: forum-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: forum
      POSTGRES_PASSWORD: forum
      POSTGRES_DB: forum_dev
    ports:
      - "5434:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: forum-redis
    restart: unless-stopped
    ports:
      - "6380:6379"

  meilisearch:
    image: getmeili/meilisearch:v1.6
    container_name: forum-meilisearch
    restart: unless-stopped
    profiles:
      - search
    environment:
      MEILI_MASTER_KEY: local-master-key
    ports:
      - "7700:7700"
    volumes:
      - meili_data:/meili_data

volumes:
  postgres_data:
  meili_data:
```

## Local URLs

| Service | URL |
|---|---|
| App | `http://localhost:3000` |
| PostgreSQL | `localhost:5434` |
| Redis | `localhost:6380` |
| Prisma Studio | `http://localhost:5555` |
| Meilisearch | `http://localhost:7700` |

Start Meilisearch only when search infrastructure is needed:

```bash
docker compose --profile search up -d
```

## Troubleshooting

### Port already in use

```bash
netstat -ano | findstr :3000
```

Change port:

```bash
pnpm dev -- -p 3001
```

### Database connection fails

Check Docker:

```bash
docker ps
```

If Docker reports that it cannot connect to `dockerDesktopLinuxEngine`, start Docker Desktop and wait for the Linux engine to become ready.

If Prisma reports authentication failure for `forum`, confirm `DATABASE_URL` points to the Docker-mapped Postgres port: `localhost:5434`.

Restart services:

```bash
docker compose down
docker compose up -d
```

### Prisma client stale

```bash
pnpm db:generate
```

## Seed credentials

After `pnpm db:seed`, all of these use password `password123`:

- admin@example.com (ADMIN)
- moderator@example.com (MODERATOR)
- member1@example.com � member5@example.com (MEMBER)
- unverified@example.com (MEMBER, email not verified)
- suspended@example.com (MEMBER, suspended)
