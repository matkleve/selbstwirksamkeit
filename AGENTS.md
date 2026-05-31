# Agent-Anweisungen

## Git-Branch für Features

**Alle Feature-Arbeit und Commits gehören auf den Branch `features`.**

- Vor dem Coden: `git checkout features` (bzw. `git switch features`)
- Nach Änderungen: committen **auf `features`**, nicht auf `master`
- `master` ist für stabile Releases — nur mergen, wenn der Nutzer das ausdrücklich verlangt

```bash
git fetch origin
git switch features
# … Änderungen …
git add <relevante Dateien>
git commit -m "feat: …"
git push origin features
```

Wenn `features` lokal fehlt: `git switch -c features origin/features`

## Projekt-Kurzinfo

- Next.js 15 + Supabase (Erfolgs-Journal „Selbstwirksamkeit“)
- UI: Tailwind (keine separate UI-Library)
- Production: https://selbstwirksamkeit.vercel.app
- Einträge: `categories text[]` (Mehrfach-Tags), RLS aktiv

## Nicht committen

- `.env.local`, `.supabase-db-password`, Secrets
- `node_modules/`, `.next/`
