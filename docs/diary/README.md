# Entscheidungsprotokoll

Jede wichtige Produkt-, UX- oder Architekturentscheidung MUST hier dokumentiert werden.

## Struktur

```
docs/diary/
  README.md           ← dieses Protokoll
  YYYY-MM-DD.md       ← ein File pro Kalendertag
```

- **Ein File pro Tag** — Dateiname = ISO-Datum (`2026-06-04.md`).
- Mehrere Entscheidungen am selben Tag → alle in derselben Datei, getrennt durch `---`.
- Neue Entscheidung an einem bestehenden Tag → Eintrag ans **Ende** der Tagesdatei anhängen.

## Eintrag-Format (RFC 2119 für MUST in Entscheidungen)

```markdown
## Kurztitel

**Entscheidung:** Was wurde entschieden.
**Alternativen:** Was verworfen wurde und warum.
**Grundlage:** Wissenschaft (`docs/science/…`), Spec, UX-Prinzip oder Pragmatik.
**Offen:** Bewusst zurückgestellt.
```

Kein Datum im Titel — steht im Dateinamen.

## Wann eintragen

Agents MUST nach jeder nicht-trivialen Entscheidung prüfen, ob ein Protokolleintrag nötig ist — insbesondere bei:

- Architektur- oder Datenmodell-Änderungen
- Abweichungen von Specs (mit Begründung)
- Wissenschaftlich begründetes UX-Verhalten
- Bewusstes Zurückstellen von Scope

## Querverweise

| Thema | Wo |
|-------|-----|
| Normative Specs | `docs/specs/` |
| Wissenschaftliche Grundlage | `docs/science/` |
| Mirror / Erkenntnistypen | `docs/specs/insight-types.md`, `docs/specs/pattern-mirror.md` |
| Reminder-Texte | `docs/specs/intention-reminders.md`, `lib/intentionReminderText.ts` |
