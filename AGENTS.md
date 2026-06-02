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
- UI: Tailwind v4 (keine separate UI-Library)

### Styling

- **Tailwind-Token statt Ad-hoc-CSS:** Farben/Schriften/Radien über Utilities aus `app/globals.css` (`@theme inline`) — z. B. `text-ink`, `bg-card`, `border-edge`, `text-ink-3`, `rounded-card`, `shadow-card`, Valenz: `bg-v-pos-mid`, `text-v-neg-strong`.
- Keine `fontSize`/`color` in `style={{}}`, außer dynamische Werte (Grid-Farben, Chart-Breiten, bilineare RGB).
- Wiederverwendbare Flächen: `components/ui/card.tsx`, `button`, `input`, `textarea`.
- Inputs/Textareas: mindestens `text-base` (16px), damit iOS beim Fokus nicht zoomt.
- Production: https://selbstwirksamkeit.vercel.app
- Einträge: `categories text[]` (Mehrfach-Tags), RLS aktiv

## Lokales Docker

```bash
npm run docker:up    # supabase start + Next.js in Container (Port 3000)
npm run docker:down  # nur Web-Container stoppen
```

Details: `docker/README.md`. Supabase-Stack läuft über die CLI (`supabase start`), nicht im App-`docker-compose.yml`.

## Nicht committen

- `.env.local`, `.env.docker`, `.supabase-db-password`, Secrets
- `node_modules/`, `.next/`
