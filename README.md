# Nexar

Employee carpool MVP for one residential-to-workspace cluster pair.

## Local setup

Requirements: Node.js 22+, pnpm 10+, and Docker Desktop.

```sh
pnpm install
cp .env.example .env
pnpm infra:up
pnpm dev
```

Local services:

- Web: http://localhost:3000
- API: http://localhost:4000/health
- Mailpit: http://localhost:8025
- MinIO console: http://localhost:9001
- PostgreSQL: localhost:15432
- Redis: localhost:16379

The design system is documented in [Design.md](Design.md). The product constraints are documented in [claude.md](claude.md).

## Architecture

- `apps/web`: Next.js employee and admin UI.
- `apps/api`: Fastify API boundary.
- `apps/worker`: background jobs and scheduled matching.
- `packages/contracts`: shared API contracts.
- `packages/config`: environment configuration.
- `packages/db`: Drizzle/PostGIS database boundary.
- `packages/matching`: deterministic matching domain logic.
- `packages/notifications`: email and SMS adapters.
- `packages/storage`: S3-compatible storage adapter.
- `packages/ui`: shared interface components.

Docker Compose runs local infrastructure by default. A full application-container profile will be added after the first application slices are implemented.