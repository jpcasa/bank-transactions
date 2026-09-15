# bank-transactions

CRUD app for bank transactions: a Hono API with generated Swagger docs, a React SPA, and Supabase Postgres. Seeded from `apps/api/data/transactions.csv`.

## Stack

| Concern | Choice |
|---|---|
| Backend | Hono + `@hono/zod-openapi` (Zod schemas drive validation and the OpenAPI spec), Swagger UI |
| Database | Supabase Postgres (`supabase/postgres` image locally, hosted Supabase in deployment). The API is the only DB client; see [ADR 0001](docs/adr/0001-supabase-as-database-only.md) |
| ORM / migrations | Drizzle ORM + drizzle-kit (`apps/api/drizzle`). Migrations and CSV seed run on API start |
| Frontend | Vite, React 19, TypeScript, Tailwind v4, shadcn-style Radix components, TanStack Query, openapi-fetch, react-hook-form + zod, `Intl` for money/date formatting |
| API types | `openapi-typescript` generates `apps/web/src/api/schema.d.ts` from the API spec (`pnpm gen:api`) |
| Tests | API integration tests against real Postgres; CSV mapper unit tests; web component tests with Testing Library + MSW |

## Endpoints

| Method | Path |
|---|---|
| GET | `/transactions` |
| GET | `/transactions/{transactionId}` |
| POST | `/transactions` |
| PUT | `/transactions/{transactionId}` |
| DELETE | `/transactions/{transactionId}` |
| GET | `/health` |
| GET | `/docs` (Swagger UI) |
| GET | `/openapi.json` |

## Quick start

```sh
docker compose up --build
```

- Web: http://localhost:8080
- API docs: http://localhost:8787/docs
- Postgres: `localhost:55432` (user `postgres`, password `postgres`, db `transactions`)

`docker compose down -v` resets the database.

## Local development

Requires Node 22 and pnpm 10 (`corepack enable`).

```sh
pnpm install
cp .env.example .env               # adjust as needed
docker compose up -d db            # Postgres only
pnpm dev                           # api on :8787, web on Vite dev server
```

| Task | Command |
|---|---|
| Tests (all) | `pnpm test` (API integration tests need `docker compose up -d db`; uses `transactions_test`) |
| Typecheck | `pnpm typecheck` |
| Build | `pnpm build` |
| Regenerate API types | `pnpm --filter api openapi:dump && pnpm gen:api` |
| New migration | `pnpm --filter api db:generate` |

## Deployment

- **Database**: create a Supabase project; set `DATABASE_URL` to its connection string (see `.env.example`). Migrations apply on API start.
- **API**: `docker build -f apps/api/Dockerfile .` and run on any container host with `DATABASE_URL`, `CORS_ORIGIN` (web origin), `PORT`, `SEED`.
- **Web**: static build. Either `docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com .` (nginx) or `VITE_API_URL=... pnpm --filter web build` and upload `apps/web/dist` to any static host with SPA fallback to `index.html`.
