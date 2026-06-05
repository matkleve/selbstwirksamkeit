# Data Catalog

Wo liegen die Daten, wer schreibt sie, wer liest sie, welche Lib-Funktionen verarbeiten sie.  
Schemadefinitionen (Spalten, Typen, RLS): → `data-model.md`

---

## Tabellen

### `entries`

Die zentrale Tabelle. Jeder Eintrag = eine Beobachtungsmoment des Nutzers.

| Operation | Wer | Datei |
|---|---|---|
| INSERT | Neuer Eintrag | `components/EntryCard.tsx` |
| UPDATE | Eintrag bearbeiten | `components/entry/EntryEditOverlay.tsx` |
| DELETE | Eintrag löschen | `components/entry/EntryCardMenu.tsx` |
| SELECT (client, alle) | Live-Liste für UI | `components/EntriesProvider.tsx` |
| SELECT (server, alle) | SSR Initial-Load | `lib/server-entries.ts → getServerEntries()` |
| SELECT (by ID) | Mirror-Kandidaten auflösen | `lib/mirror-resolve.ts` |
| SELECT (mit Embeddings) | WGARM-Analyse | `supabase/functions/run-wgarm-ec/index.ts` |
| SELECT (embed) | Embedding-Generierung | `supabase/functions/embed-entry/index.ts` |

**Felder mit Besonderheiten:**

| Feld | Verarbeitung | Lib-Funktion |
|---|---|---|
| `person`, `location`, `activity` | Komma/Semikolon-getrennt — mehrere Werte | `lib/entryMeta.ts → splitMetaValues()` |
| `grid_x`, `grid_y` | Quadrant, Zone, Farbe berechnet | `lib/gridZones.ts` |
| `body_state` | Enum-Label → deutsch | `lib/entryMeta.ts → BODY_LABELS` |
| `weather` | Auto-fetch via Geolocation + Open-Meteo (WMO-Code → Enum) | `lib/weather.ts → fetchCurrentWeather()` |
| `reframe` | Optional; erscheint wenn `grid_x < 0` | `components/ReframeFlow.tsx` |

---

### `persons` / `locations` / `activities`

Autocomplete-Tabellen. Werden bei jedem Eintrag per `UPSERT` befüllt (onConflict ignoreDuplicates).

| Operation | Wer | Datei |
|---|---|---|
| UPSERT (on save) | Neue Namen persistieren | `EntryCard.tsx → saveEntityNames()` |
| UPSERT (on edit) | Namen beim Bearbeiten | `EntryEditOverlay.tsx → saveEntityNames()` |
| SELECT (suggestions) | Autocomplete im Chip-Editor | `EntryCard.tsx` + `EntryEditOverlay.tsx` |

---

### `mirror_candidates`

Vorberechnete Muster-Insights. Werden von Hintergrundjobs befüllt, im Mirror-Flow konsumiert.

| Operation | Wer | Datei |
|---|---|---|
| INSERT (WGARM/Valence) | Kandidaten persistieren | `lib/mirror-wgarm.ts → persistWgarmCandidate()` |
| INSERT (andere Pattern) | Kandidaten aus Echtzeit-Erkennung | `lib/mirror-resolve.ts` |
| INSERT (cron) | Batch-Job | `supabase/functions/run-wgarm-ec/index.ts` |
| SELECT (offene) | Nächsten Kandidaten holen | `lib/mirror-resolve.ts → resolveMirrorCandidate()` |
| UPDATE shown/shown_at | Als angezeigt markieren | `lib/mirror-resolve.ts` |
| UPDATE user_reaction | Nutzer-Feedback speichern | Mirror-Flow-Komponenten |

**`pattern_metadata` (JSONB) — Schlüssel je nach `source`:**

| source | Felder in pattern_metadata |
|---|---|
| `wgarm_ec` | `antecedent[]`, `consequent[]`, `confidence`, `is_escalating` |
| `valence_shift` | `from_zone`, `to_zone`, `delta` |
| `tag_frequency` | `kind`, `value`, `count` |
| `grid_cluster` | `quadrant`, `count` |
| `time_correlation` | `time_slot`, `avg_valence` |
| `weekday_pattern` | `weekday_group`, `avg_valence` |

---

### `mirror_sessions`

Abgeschlossene Mirror-Sitzungen — was der Nutzer gesehen und reflektiert hat.

| Operation | Wer | Datei |
|---|---|---|
| INSERT | Session starten | `components/mirror/MirrorFlow.useLoading.ts` |
| UPDATE user_response | Reflexion speichern | `components/mirror/MirrorFlow.response.tsx` |
| UPDATE is_favorited | Favorit togglen | `components/mirror/MirrorHistory.tsx` |
| SELECT (history) | Verlauf anzeigen | `lib/mirror-session.ts → fetchMirrorHistory()` |

---

### `implementation_intentions`

Wenn-Dann-Vorsätze, die optional mit Push-Reminders verknüpft sind.

| Operation | Wer | Datei |
|---|---|---|
| INSERT | Nach Mirror-Session | `components/mirror/MirrorFlow.tsx` |
| SELECT + UPDATE | Reminder zustellen | `lib/push/deliver-reminders.ts` |
| UPDATE active=false | Ablauf/Feuerlimit | `lib/push/deliver-reminders.ts` |

---

### `push_subscriptions`

Web-Push-Endpunkte der Nutzer.

| Operation | Wer | Datei |
|---|---|---|
| UPSERT | Push-Permission erteilt | `app/api/push/subscribe/route.ts` |
| SELECT | Reminders zustellen | `lib/push/deliver-reminders.ts` |

---

## Lib-Layer

| Datei | Exportiert | Eingabe | Ausgabe |
|---|---|---|---|
| `lib/entryMeta.ts` | `splitMetaValues`, `getEntryMeta`, `isMetaRelevant` | `Entry` / raw string | Strukturierte Meta-Gruppen |
| `lib/gridZones.ts` | `getZone`, `getQuadrant`, `cardBoxShadow`, `bilinearColor` | `grid_x, grid_y` | Zone-Key, Farbe, Shadow |
| `lib/wgarmEc.ts` | `runWgarmEc`, `toWgarmEntry`, `regenerateInsightText`, `metaLabelsFromAntecedent` | `Entry[]` | WGARM-Kandidaten, Insight-Texte |
| `lib/patternDetection.ts` | `detectTagFrequency`, `detectTemporalEcho`, `detectTimeCorrelation`, `detectWeekdayPattern`, `candidateFromStored` | `Entry[]` / stored row | `MirrorCandidate \| null` |
| `lib/mirror-resolve.ts` | `resolveMirrorCandidate` | Supabase client + `Entry[]` | Aufgelöster Kandidat für den Flow |
| `lib/mirror-wgarm.ts` | `persistWgarmCandidate`, `persistValenceShiftCandidate` | Kandidat + uid | DB-Insert |
| `lib/mirror-session.ts` | `fetchMirrorHistory` | Supabase client | `MirrorSessionRow[]` mit Einträgen |
| `lib/server-entries.ts` | `getServerEntries` | — | `Entry[]` (server-seitig, gecacht) |
| `lib/supabase.ts` | `createClient` | — | Browser-Supabase-Client (Singleton) |
| `lib/supabase-server.ts` | `createServerSupabaseClient` | — | Server-Supabase-Client |
| `lib/changelog.ts` | `CHANGELOG`, `APP_VERSION` | — | Versionsverlauf |
| `lib/feelings.ts` | `FEELINGS` | — | Gefühls-Enum → Label-Mapping |
| `lib/weather.ts` | `fetchCurrentWeather`, `WEATHER_LABELS`, `WEATHER_EMOJI` | Geolocation + Open-Meteo | `Weather` enum-Wert |
| `lib/utils.ts` | `formatTime`, `formatEntryDateTime`, `cn` | — | Datum-Formatierung, CSS-Klassen |
| `lib/chip-classes.ts` | `chipGhost`, `chipFilled`, `chipField` | — | Tailwind-Klassen für Chips |

---

## API-Routes (`app/api/`)

| Route | Methode | Auth | Funktion |
|---|---|---|---|
| `/api/cron/intention-reminders` | GET | Bearer-Token | `deliverIntentionReminders()` — liest aktive Intentions, sendet Push |
| `/api/push/subscribe` | POST | Session-Cookie | Push-Endpoint in `push_subscriptions` upserten |

---

## Edge-Functions (`supabase/functions/`)

| Funktion | Trigger | Reads | Writes |
|---|---|---|---|
| `run-wgarm-ec` | Cron-Job | `entries` (mit Embeddings) | `mirror_candidates` |
| `embed-entry` | DB-Hook / manuell | `entries` | `entries.embedding` (pgvector) |

---

## Datenfluss-Übersicht

```
Nutzer tippt Eintrag
        │
        ▼
EntryCard.tsx ──INSERT──► entries
        │
        └──UPSERT──► persons / locations / activities
                              │
                (Autocomplete beim nächsten Eintrag)

entries ──SELECT──► EntriesProvider  ──► Timeline, Dashboard, Home
                         │
                         └──► lib/patternDetection.ts
                                    │
                                    ▼
                              mirror_candidates ──► lib/mirror-resolve.ts
                                                          │
                                                          ▼
                                                    MirrorFlow
                                                          │
                                              ┌───────────┴────────────┐
                                              ▼                        ▼
                                       mirror_sessions   implementation_intentions
                                              │                        │
                                       MirrorHistory        Cron → Push Notification
```

---

## Feature → Datenpfad (Kurzreferenz)

| Feature | Primäre Daten | Einstiegspunkt |
|---|---|---|
| Neuer Eintrag | `entries` INSERT | `EntryCard.tsx` |
| Eintrag bearbeiten | `entries` UPDATE | `EntryEditOverlay.tsx` |
| Verlauf anzeigen | `entries` SELECT (EntriesProvider) | `TimelineView.tsx` |
| Dashboard/Übersicht | `entries` (aggregiert) | `DashboardView.tsx` |
| Muster erkennen | `entries` → `patternDetection.ts` → `mirror_candidates` | `lib/patternDetection.ts` |
| Spiegel-Flow | `mirror_candidates` → `mirror_sessions` | `lib/mirror-resolve.ts` |
| Spiegel-Verlauf | `mirror_sessions` | `lib/mirror-session.ts` |
| Wenn-Dann Vorsatz | `implementation_intentions` INSERT | `MirrorFlow.tsx` |
| Push-Reminder | `implementation_intentions` + `push_subscriptions` | `lib/push/deliver-reminders.ts` |
| Versionsverlauf | statisch in `lib/changelog.ts` | `ChangelogPanel.tsx` |
