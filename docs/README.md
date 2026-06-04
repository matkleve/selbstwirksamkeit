# Dokumentation

## Specs (`docs/specs/`) — normativ, RFC 2119

Spec **before** code. Bei Konflikt Spec aktualisieren oder Entscheidung in `docs/diary/` begründen.

| Datei | Inhalt |
|-------|--------|
| `overview.md` | App-Überblick, Routen |
| `pattern-mirror.md` | Mirror UI, Detektoren, DB |
| `mirror-page.md` | `/mirror` Landing, Pre-Generated Candidates, History |
| `insight-types.md` | Erkenntnistypen, Response Blocks, Templates |
| `intention-reminders.md` | Reminder-Chips + Notification-Texte |
| `wgarm-ec.md` | WGARM-EC Pipeline |
| `embeddings.md` | Mistral Embed, Backfill |
| `data-model.md` | Tabellen, Felder |
| `design-system.md` | Tokens, Komponenten |
| `features.md` | Feature-Liste |
| `motivation.md` | Motivation/Stärke (geplant) |

## Science (`docs/science/`) — Begründung, nicht normativ

| Datei | Inhalt |
|-------|--------|
| `implementation-intentions.md` | WENN-DANN, Reminder-Fading, Self-Compassion |
| `mirror-patterns.md` | T-Pattern, Expressive Writing, Pull-Architektur, WGARM |

Specs MUST auf Science verweisen, wo Verhalten empirisch begründet ist.

## Entscheidungsprotokoll (`docs/diary/`)

Ein Markdown-File pro Tag: `YYYY-MM-DD.md`. Siehe `docs/diary/README.md`.

Agents MUST nach wichtigen Entscheidungen einen Eintrag im Tagesfile anlegen oder ergänzen.
