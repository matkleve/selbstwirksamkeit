#!/usr/bin/env bash
# Writes .env.docker from `supabase status` for the web container.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/.env.docker"

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
# Container must reach Supabase on the host, not 127.0.0.1 inside the container.
DOCKER_API_URL="${DOCKER_SUPABASE_URL:-http://host.docker.internal:54321}"

cat > "$OUT" <<EOF
# Auto-generated — do not commit (.gitignore)
NEXT_PUBLIC_SUPABASE_URL=$DOCKER_API_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
EOF

echo "Wrote $OUT (API on host: $API_URL → container: $DOCKER_API_URL)"
