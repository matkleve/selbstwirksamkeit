#!/usr/bin/env bash
# Start local Supabase (Docker via CLI) + Next.js dev server in Docker.
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

echo "→ Starting local Supabase (migrations from supabase/migrations/)…"
supabase start

echo "→ Writing .env.docker for the web container…"
bash "$ROOT/scripts/docker-env.sh"

echo "→ Starting Next.js (http://localhost:${APP_PORT:-3000})…"
exec docker compose up --build "$@"
