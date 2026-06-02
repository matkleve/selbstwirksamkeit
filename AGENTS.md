# Agent-Anweisungen

## Git-Branch

**Standard: `production`** — alle Arbeit und Commits hier (Deploy-Branch, Vercel).

```bash
git fetch origin
git switch production
git pull origin production
# … Änderungen …
git add <relevante Dateien>
git commit -m "feat: …"
git push origin production
```

- `master` — historisch/parallel; nicht für neue Arbeit, außer der Nutzer verlangt es.
- `features` — alter Feature-Branch; nicht mehr Standard.

Wenn `production` lokal fehlt: `git switch -c production origin/production` oder `git switch -c production master`

## Projekt-Kurzinfo

- Next.js 15 + Supabase (Erfolgs-Journal „Selbstwirksamkeit“)
- UI: Tailwind v4 (keine separate UI-Library)
- Production: https://selbstwirksamkeit.vercel.app
- Einträge: `categories text[]` (Mehrfach-Tags), RLS aktiv

### Styling

- **Tailwind-Token** aus `app/globals.css` (`text-ink`, `bg-card`, `border-edge`, …)
- Inputs mindestens `text-base` (16px) — kein iOS-Zoom

## Lokales Docker

```bash
npm run local:up     # empfohlen: supabase start + Next.js auf dem Host
npm run docker:up    # optional: Next.js im Container
npm run docker:down
npm run fix:next     # .next-Rechte nach Docker-Konflikt (Host)
```

Details: `docker/README.md`

## Nicht committen

- `.env.local`, `.env.docker`, `.supabase-db-password`, Secrets
- `node_modules/`, `.next/`
