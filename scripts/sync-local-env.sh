#!/usr/bin/env bash
# Merge local Supabase keys from `supabase status` into .env.local (keeps MISTRAL_KEY, etc.).
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
ANON_KEY="${ANON_KEY//\"/}"
SERVICE_ROLE_KEY="${SERVICE_ROLE_KEY//\"/}"

TMP="$(mktemp)"
if [[ -f "$OUT" ]]; then
  grep -v -E '^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)=' "$OUT" \
    | grep -v -E '^# (Supabase project:|Local Supabase|Auto-generated)' \
    > "$TMP" || true
else
  : > "$TMP"
fi

{
  echo "# Local Supabase (synced by npm run local:up / sync-local-env.sh)"
  echo "NEXT_PUBLIC_SUPABASE_URL=$API_URL"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
  echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
  echo ""
  cat "$TMP"
} > "$OUT"
rm -f "$TMP"

echo "→ .env.local: Supabase → $API_URL (other vars kept)"
