# Ticket Status

Support ticket system built with Next.js 16, Drizzle ORM (Postgres), and ShadCN-style UI primitives. Two surfaces:

- **Customer side** (`/`): public form to file a new ticket, with a tracking page at `/tickets/[publicId]`.
- **Admin side** (`/admin`): credential login, dashboard listing tickets assigned to the signed-in admin, and a detail page to update status / claim tickets.

## Stack

- Next.js 16 (App Router, Turbopack, Server Actions)
- React 19.2
- Drizzle ORM + `postgres` driver
- `jose` JWT sessions in an HttpOnly cookie
- `bcryptjs` for password hashing
- Tailwind CSS v4 + ShadCN-style components

## Local development

1. **Postgres**: have an instance running locally (or use the bundled `docker-compose.yml`).
2. **Env**: copy `.env.example` to `.env` and fill in real values:

   ```bash
   cp .env.example .env
   # generate secrets:
   openssl rand -base64 32   # → SESSION_SECRET
   openssl rand -base64 32   # → NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
   ```

3. **Install + migrate + seed**:

   ```bash
   npm install
   npm run db:migrate   # apply migrations
   npm run db:seed      # creates 1 admin + 5 sample tickets
   ```

4. **Run**:

   ```bash
   npm run dev
   ```

   - Customer form: <http://localhost:3000>
   - Admin login: <http://localhost:3000/admin/login>
     Default seeded credentials: `admin@example.com` / `admin12345` (change `SEED_ADMIN_*` in `.env` before running `db:seed` to override).

## Database scripts

| Command | Description |
| --- | --- |
| `npm run db:generate` | Generate a SQL migration from `lib/db/schema.ts` into `drizzle/`. |
| `npm run db:migrate` | Apply pending migrations to `DATABASE_URL`. |
| `npm run db:push` | Push schema directly (handy in early dev). |
| `npm run db:studio` | Open Drizzle Studio. |
| `npm run db:seed` | Insert the default admin + sample tickets (idempotent). |

## Production with Docker

Two Compose flows are supported:

```bash
# Build images and start db + run migrations + start the app
docker compose up --build -d

# (Optional, one-shot) seed the admin + sample tickets
docker compose --profile seed run --rm seed
```

The `app` service runs the Next.js standalone server on port `3000`. The `migrate` service runs `drizzle-kit migrate` against the bundled Postgres before `app` starts. Required env vars (set them in a top-level `.env` next to `docker-compose.yml`):

- `SESSION_SECRET` — base64 string, ≥32 bytes
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` — base64, used by Next when running multiple instances
- Optional: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `APP_PORT`, `SEED_ADMIN_*`

## Project structure

```
app/
  page.tsx                  customer landing form
  tickets/[publicId]/       public ticket status page
  admin/
    login/                  login page + form
    page.tsx                "tickets assigned to me" dashboard
    tickets/[id]/           admin ticket detail (status update, claim)
    actions.ts              login / logout server actions
    layout.tsx              admin shell w/ sign-out
components/
  ui/                       shadcn primitives (button, input, card, …)
  ticket-status-badge.tsx
lib/
  db/
    schema.ts               drizzle schema + enums
    index.ts                drizzle client
    seed.ts                 seeder
  auth/
    session.ts              jose-based JWT session helpers
    dal.ts                  verifySession (cached)
  tickets/actions.ts        ticket server actions
proxy.ts                    Next.js 16 "proxy" (formerly middleware) for /admin
drizzle/                    generated SQL migrations
Dockerfile                  multi-stage: deps → builder → runner (+ migrator)
docker-compose.yml          db + migrate + (optional) seed + app
```

## Notes on Next.js 16

This codebase targets Next.js 16, which has breaking changes vs. older docs:

- `middleware.ts` → `proxy.ts` (Node runtime, not Edge).
- `cookies()`, `headers()`, `params`, and `searchParams` are async — always `await`.
- Turbopack is the default for `dev` and `build`.
- Standalone output (`output: "standalone"` in `next.config.ts`) is required for the Docker image.
