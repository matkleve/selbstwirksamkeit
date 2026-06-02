# Local Docker

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + Compose v2
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase` on your `PATH`)

The app needs **Supabase Auth + Postgres (RLS)**. Local Supabase is started by the CLI (`supabase start`), which runs its own Docker containers (Kong, Postgres, GoTrue, Studio, …). The **Next.js dev server** runs in a separate container from this repo’s `docker-compose.yml`.

## Quick start

```bash
npm run docker:up
```

Open:

- App: http://localhost:3000
- Supabase Studio: http://localhost:54323 (after `supabase start`)

First run creates `.env.docker` from `supabase status` (gitignored).

## Commands

| Command | Description |
|--------|-------------|
| `npm run docker:up` | `supabase start` + build/run `web` |
| `npm run docker:down` | Stop the Next.js container |
| `npm run docker:env` | Regenerate `.env.docker` only |
| `supabase stop` | Stop local Supabase stack |
| `supabase db reset` | Reset DB + re-run migrations |

## Manual workflow

```bash
supabase start
npm run docker:env
docker compose up --build
```

## Production-like image

Build args must match your Supabase project (or local keys):

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up
```

## Troubleshooting

- **“Cannot connect to Supabase” from the app container**  
  Ensure `.env.docker` uses `http://host.docker.internal:54321`, not `127.0.0.1`. Regenerate: `npm run docker:env`.

- **Port 3000 in use**  
  `APP_PORT=3001 npm run docker:up` — or stop the other process: `docker compose down` / quit host `npm run dev`.

- **`EACCES` on `.next/types/…` after Docker**  
  The web container used to write `.next` as root. Fixed via `user:` in compose; if it happens again:
  `docker run --rm -v "$PWD:/app" alpine chown -R "$(id -u):$(id -g)" /app/.next`
  Or remove `.next` and restart: `rm -rf .next && npm run dev`.

- **Migrations**  
  Edit `supabase/migrations/`, then `supabase db reset` or `supabase migration up`.
