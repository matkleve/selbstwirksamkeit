#!/usr/bin/env bash
# Fix or remove .next when Docker wrote files as root (EACCES on npm run dev).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if docker ps -q --filter name=selbstwirksamkeit-web 2>/dev/null | grep -q .; then
  echo "→ Stopping selbstwirksamkeit-web container…"
  docker stop selbstwirksamkeit-web-1 2>/dev/null || docker compose down 2>/dev/null || true
fi

if [[ ! -d .next ]]; then
  echo "No .next directory — OK."
  exit 0
fi

if find .next -user root 2>/dev/null | grep -q .; then
  echo "→ Removing root-owned .next via Docker…"
  docker run --rm -v "$ROOT:/app" alpine rm -rf /app/.next
  echo "Done. Run: npm run dev"
else
  echo ".next is owned by you. If issues persist: rm -rf .next && npm run dev"
fi
