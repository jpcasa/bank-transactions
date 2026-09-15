# Supabase is used as a Postgres database only, behind a Hono API

The brief requires a CRUD API that is self-documented with Swagger. Supabase's auto-generated PostgREST API and its OpenAPI output don't give us a designed, well-documented contract, so the frontend never talks to Supabase directly: a Hono API (`@hono/zod-openapi`, Drizzle) owns the contract and connects via `DATABASE_URL`. Locally, `docker compose` runs the `supabase/postgres` image rather than `supabase start`, so the whole stack comes up with one command; in deployment `DATABASE_URL` points at a hosted Supabase project.

## Considered Options

- **supabase-js / PostgREST from the browser** — rejected: no Swagger-quality contract, and no server-side seam to test.
- **`supabase start` alongside compose** — rejected: ~10 extra containers outside `docker compose`, two commands to run.
- **Hosted Supabase from day one** — rejected: tests and local runs would need network access and project credentials.
