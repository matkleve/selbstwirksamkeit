# Agent-Anweisungen

## Git-Branch

**Standard: `master`** — alle Arbeit und Commits hier (Stand: Nutzerwunsch, ein Deploy-Branch).

```bash
git fetch origin
git switch master
git pull origin master
# … Änderungen …
git add <relevante Dateien>
git commit -m "feat: …"
git push origin master
```

`features` nur nutzen, wenn der Nutzer das ausdrücklich verlangt.

## Projekt-Kurzinfo

- Next.js 15 + Supabase (Erfolgs-Journal „Selbstwirksamkeit“)
- UI: Tailwind (keine separate UI-Library)
- Production: https://selbstwirksamkeit.vercel.app
- Einträge: `categories text[]` (Mehrfach-Tags), RLS aktiv

## Nicht committen

- `.env.local`, `.supabase-db-password`, Secrets
- `node_modules/`, `.next/`
