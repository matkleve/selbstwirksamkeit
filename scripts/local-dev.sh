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

echo "→ Syncing local Supabase keys into .env.local (keeps MISTRAL_KEY, etc.)…"
bash "$ROOT/scripts/sync-local-env.sh"

echo "→ Starting Next.js on http://localhost:3000 …"
exec npm run dev
