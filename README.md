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
pnpm build
```

## Local Services

| Service | URL |
|---|---|
| App | `http://localhost:3000` |
| PostgreSQL | `localhost:5433` |
| Redis | `localhost:6379` |
| Meilisearch | `http://localhost:7700` |
