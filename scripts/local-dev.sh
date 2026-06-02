#!/usr/bin/env bash
# Recommended local workflow: Supabase in Docker (CLI) + Next.js on the host.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

echo "→ Starting local Supabase…"
supabase start

if [[ ! -f .env.local ]]; then
  echo "→ Creating .env.local from supabase status…"
  bash "$ROOT/scripts/write-local-env.sh"
else
  echo "→ Using existing .env.local (delete it to regenerate from supabase status)"
fi

echo "→ Starting Next.js on http://localhost:3000 …"
exec npm run dev
