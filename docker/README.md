# Local development

## Why Docker for Next.js was painful

This repo runs **Supabase in Docker already** (via `supabase start`). Putting **Next.js in a second container** adds:

1. **UID/GID mismatches** — bind mounts use your host user; empty **named** volumes are created as `root` ([docker/compose#3270](https://github.com/docker/compose/issues/3270)).
2. **Port clashes** — host `npm run dev` and the web container both want `:3000`.
3. **Slow builds** — copying the whole tree into the image and `chown -R` took minutes.

That is a common stack overflow / forum topic, not something unique to this project. The usual fixes are: match `user:` to the host UID, use **anonymous** volumes for `node_modules` and `.next` (so the image seeds permissions), or **skip Docker for the app** and only containerize the database.

## Recommended: Supabase in Docker, Next.js on the host

```bash
npm run local:up
```

- `supabase start` — Postgres, Auth, Studio (Docker, managed by CLI)
- `npm run dev` — Next.js on http://localhost:3000 with `.env.local` → `127.0.0.1:54321`

No volume permission scripts, no port fight with a web container, fast HMR.

First time without `.env.local`:

```bash
supabase start
bash scripts/write-local-env.sh
npm run dev
```

## Optional: Next.js in Docker

```bash
npm run docker:up
```

Uses anonymous volumes for `/app/node_modules` and `/app/.next` (content copied from the image on first start). **Do not run `npm run dev` on the host at the same time** — same port 3000.

| Command | Description |
|--------|-------------|
| `npm run local:up` | **Recommended** — Supabase + host Next.js |
| `npm run docker:up` | Supabase + Next.js in Docker |
| `npm run docker:down` | Stop web container |
| `npm run docker:env` | Regenerate `.env.docker` only |
| `supabase stop` | Stop local Supabase stack |

If Docker web breaks after old setups:

```bash
npm run docker:down
docker volume rm selbstwirksamkeit_web_next selbstwirksamkeit_web_node_modules 2>/dev/null || true
npm run docker:up
```

## Troubleshooting

- **Login fails: CORS / `host.docker.internal` in the browser**  
  `NEXT_PUBLIC_SUPABASE_URL` must be `http://127.0.0.1:54321` (browser). Only server-side code uses `SUPABASE_URL=http://host.docker.internal:54321`. Regenerate: `npm run docker:env`, then restart the web container.

- **`Auth session missing!` but cookie `sb-127-auth-token` is present**  
  Server SSR used the wrong cookie name (`sb-host-auth-token` when `SUPABASE_URL` is `host.docker.internal`). Fixed via `getSupabaseStorageKey()` from the public URL. Clear cookies and log in again.

- **Cannot connect to Supabase from SSR in the app container**  
  Ensure `SUPABASE_URL` is set in `.env.docker`. Regenerate: `npm run docker:env`.

- **Port 3000 in use**  
  Stop host dev (`pkill -f next-server`) or `APP_PORT=3001 npm run docker:up`.

- **`EACCES` on `.next` on the host**  
  `npm run fix:next` or `rm -rf .next && npm run dev`.

- **Migrations**  
  `supabase db reset` or `supabase migration up`.

## Production-like image

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up
```
