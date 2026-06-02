#!/usr/bin/env bash
# Optional: Next.js in Docker + Supabase via CLI. Prefer: npm run local:up
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 not found." >&2
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

# Legacy named volumes were root-owned and broke non-root containers.
for vol in selbstwirksamkeit_web_next selbstwirksamkeit_web_node_modules; do
  if docker volume inspect "$vol" >/dev/null 2>&1; then
    echo "→ Removing legacy volume ${vol} (use anonymous volumes now)…"
    docker compose down 2>/dev/null || true
    docker volume rm "$vol" 2>/dev/null || true
  fi
done

echo "→ Starting local Supabase (migrations from supabase/migrations/)…"
supabase start

echo "→ Writing .env.docker for the web container…"
bash "$ROOT/scripts/docker-env.sh"

export DOCKER_UID="${DOCKER_UID:-$(id -u)}"
export DOCKER_GID="${DOCKER_GID:-$(id -g)}"

echo "→ Starting Next.js (http://localhost:${APP_PORT:-3000})…"
echo "   Tip: for fewer Docker issues, use npm run local:up instead."
exec docker compose up --build "$@"
