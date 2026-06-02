#!/usr/bin/env bash
# Writes .env.local from `supabase status` for host `npm run dev`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/.env.local"

cd "$ROOT"

if ! supabase status >/dev/null 2>&1; then
  echo "Local Supabase is not running. Start with: supabase start" >&2
  exit 1
fi

eval "$(supabase status -o env 2>/dev/null | grep -E '^[A-Z_][A-Z0-9_]*=')"

if [[ -z "${ANON_KEY:-}" ]]; then
  echo "Could not read ANON_KEY from supabase status." >&2
  exit 1
fi

API_URL="${API_URL:-http://127.0.0.1:54321}"

cat > "$OUT" <<EOF
# Auto-generated — do not commit (.gitignore)
NEXT_PUBLIC_SUPABASE_URL=$API_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
EOF

echo "Wrote $OUT"
