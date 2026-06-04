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

## Dokumentation — Spec vor Code

Übersicht: **`docs/README.md`**

### Specs (`docs/specs/`, normativ)

Vor Implementierung von Mirror, Remindern, Detektoren oder DB-Änderungen die passende Spec lesen:

- Mirror / UI / Detektoren: `pattern-mirror.md`, `insight-types.md`
- Reminder-Texte: `intention-reminders.md` → Code: `lib/intentionReminderText.ts`
- WGARM-EC: `wgarm-ec.md`
- Embeddings: `embeddings.md`

Abweichung von Spec → zuerst Spec anpassen **oder** Eintrag in `docs/diary/YYYY-MM-DD.md` mit Begründung.

### Science (`docs/science/`, Begründung)

- `implementation-intentions.md` — Reminder-Fading, non-direktive Sprache
- `mirror-patterns.md` — Pull-Architektur, T-Pattern, Expressive Writing

### Entscheidungsprotokoll (`docs/diary/`)

- **Ein File pro Tag:** `docs/diary/YYYY-MM-DD.md`
- Protokoll: `docs/diary/README.md`
- Nach jeder wichtigen Entscheidung Eintrag anlegen oder ans Tagesfile anhängen (Format dort).

## Projekt-Kurzinfo

- Next.js 15 + Supabase (Erfolgs-Journal „Selbstwirksamkeit“)
- UI: Tailwind v4 (keine separate UI-Library)
- Production: https://selbstwirksamkeit.vercel.app
- Mirror: `components/mirror/` (Flow aufgeteilt), Spec v1.2 in `insight-types.md`

### Styling

- **Tailwind-Token** aus `app/globals.css` (`text-ink`, `bg-card`, `border-edge`, …)
- Inputs mindestens `text-base` (16px) — kein iOS-Zoom
- Mirror-Buttons: `variant="gold"` in `components/ui/button.tsx`

### Tests (standalone)

```bash
npx tsx lib/__tests__/patternDetection.test.ts
npx tsx lib/__tests__/insightText.test.ts
npx tsx lib/__tests__/intentionReminderText.test.ts
npm run test:mirror
```

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
