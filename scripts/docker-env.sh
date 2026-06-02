#!/usr/bin/env bash
# Writes .env.docker from `supabase status` for the web container.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/.env.docker"
# Next.js auto-loads .env.local from the bind mount; overlay local Supabase keys in Docker.
SYNC="$ROOT/.env.docker.sync"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

cd "$ROOT"

if ! supabase status >/dev/null 2>&1; then
  echo "Local Supabase is not running. Start with: supabase start" >&2
  exit 1
fi

# shellcheck disable=SC1090
eval "$(supabase status -o env 2>/dev/null | grep -E '^[A-Z_][A-Z0-9_]*=')"

if [[ -z "${ANON_KEY:-}" ]]; then
  echo "Could not read ANON_KEY from supabase status." >&2
  exit 1
fi

API_URL="${API_URL:-http://127.0.0.1:54321}"
# Browser on the host must not use host.docker.internal (CORS / unreachable).
PUBLIC_URL="${PUBLIC_SUPABASE_URL:-$API_URL}"
# SSR inside the web container reaches Supabase on the host, not 127.0.0.1 in-container.
SERVER_URL="${SUPABASE_URL:-${DOCKER_SUPABASE_URL:-http://host.docker.internal:54321}}"

cat > "$OUT" <<EOF
# Auto-generated — do not commit (.gitignore)
# NEXT_PUBLIC_* is used in the browser (localhost:3000) → host loopback.
NEXT_PUBLIC_SUPABASE_URL=$PUBLIC_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
# Server-only: web container → Supabase on the host.
SUPABASE_URL=$SERVER_URL
EOF

cat > "$SYNC" <<EOF
# Auto-generated for Docker — masks host .env.local (production keys). Do not commit.
NEXT_PUBLIC_SUPABASE_URL=$PUBLIC_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
EOF

echo "Wrote $OUT + $SYNC (browser: $PUBLIC_URL, container SSR: $SERVER_URL)"
