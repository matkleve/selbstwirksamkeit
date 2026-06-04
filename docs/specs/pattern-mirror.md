# Pattern Mirror — Specification v5

Combines Phase-1 structural detectors, WGARM-EC association-rule engine, and Mirror invariants.

---

## Phase separation

### Phase 1 — structure only (daily)

No free text analysis, no embeddings, no NLP.

**Detector 1 — Tag frequency**
- Same tag type (person / location / activity / body_state) appears ≥3× across full entry history
- Input: structured tags + `created_at` — **no time-window filter**
- Signal: `mirror_candidates.source = 'tag_frequency'`
- Output describes interval + span in **Mirror voice** (not Dashboard stats): „müde kommt alle ~5 Tage vor — 8× seit Januar"
- `body_state` MUST use German labels (`ruhig`, `müde`, `gestresst`), not English enum values

**Detector 2 — Grid cluster**
- ≥3 entries in the same valence quadrant (±ich / ±andere) across full entry history
- Input: `grid_x`, `grid_y`, `created_at` — **no time-window filter**
- Signal: `mirror_candidates.source = 'grid_cluster'`
- Output in Mirror voice: „Du kehrst immer wieder zu Momenten zurück, die sich positiv und anderen zugewandt anfühlen — 58×, alle ~6 Tage, seit Mai 2025." (no „Einträge lagen im Bereich …")

### Phase 2 — WGARM-EC (weekly, ≥50 entries with embeddings)

**Gate:** Phase 2 MUST NOT begin until Phase 1 is verified correct **and** explicitly confirmed by project lead. Agents MUST NOT self-authorize Phase 2 start.

See `wgarm-ec.md` and `embeddings.md` for the full algorithm and embedding specs.

- On entry save: embed via Mistral `mistral-embed` (see `embeddings.md`) with context prefix `"[{tags}] {text}"` → `entries.embedding vector(1024)`
- Weekly job: semantic clustering + FP-Growth association rules → `mirror_candidates` with `source = 'wgarm_ec'`
- Legacy temporal similarity (`embedding_temporal`, cosine > 0.75 AND span > 21 days) remains supported as fallback

**Critical:** Seed generation from recent entries produces echo, not mirror. Temporal distance is the relevance signal.

---

## mirror_candidates table

```sql
CREATE TABLE mirror_candidates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  entry_ids       uuid[] NOT NULL,
  source          text NOT NULL,  -- tag_frequency | grid_cluster | embedding_temporal | wgarm_ec
  signal_strength text NOT NULL,  -- weak | moderate | strong
  intro_text      text,           -- Phase 1 display text
  question        text,           -- single open question
  template_text   text,           -- WGARM-EC rule text (replaces intro+question)
  pattern_metadata jsonb,
  shown           boolean DEFAULT false,
  shown_at        timestamptz,
  user_reaction   text,           -- confirmed | dismissed | null
  created_at      timestamptz DEFAULT now()
);
```

---

## Mirror invariants (hard rules)

**Mirror MAY:**
- Show the user's own entries (original text, chronological)
- Name frequency: "du hast das 3× geschrieben"
- Ask exactly one open question
- Offer Wenn-Dann after "Ich erkenne das"

**Mirror MUST NOT:**
- Show positive counterexamples ("hier war es besser")
- Give behavioural advice
- Make evaluations ("das war eine gute Woche")
- Use LLM interpretation in Phase 1
- Ask more than one question
- Show entries from the last 7 days as the main finding (recent week = context, not insight)

Positive counterexamples and resources belong to **Stärke**, not Mirror.

---

## LLM prompt constraint (Phase 2+)

```
KRITISCH: Zeige niemals positive Gegenbeispiele.
Zeige niemals was "besser" war.
Deine einzige Aufgabe: die Wiederholung sichtbar machen und eine Frage stellen.
Wenn du keinen klaren Zeitabstand zwischen den Einträgen siehst (mindestens 3 Wochen),
antworte mit pattern_found: false.
```

---

## Workflow (RFC 2119)

Normative language in this document follows [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119): **MUST**, **MUST NOT**, **SHOULD**, **MAY**.

### Spec before code

1. Spec changes MUST be written and shown before implementation begins.
2. Agents MUST NOT implement features from assumptions — only from documented spec decisions.
3. When spec and code diverge, spec wins; code MUST be updated or spec MUST be amended first.

### Stop points

Implementation MUST pause at these gates for explicit review:

| After step | Deliverable | Proceed only when |
|---|---|---|
| Spec update | Diff of spec changes | Project lead confirms spec |
| Embedding spec (`embeddings.md`) | Mistral model + vector(1024) decision | Project lead confirms spec |
| Phase 1 complete | Test run with real entries | Project lead confirms detectors |
| Phase 5 (WGARM-EC job) | Example mirror_candidates | Project lead confirms before Mirror displays them |
| Phase 2 start | — | **Explicit confirmation required** — agents MUST NOT self-start Phase 2 |

---

## Implementation order

1. `mirror_candidates` + `mirror_sessions` + `implementation_intentions` migrations
2. Phase 1 detectors (TypeScript, daily/on-demand)
3. pgvector + `entries.embedding vector(1024)` — Mistral `mistral-embed` (see `embeddings.md`)
4. Embedding on entry save (Edge Function, Mistral API)
5. WGARM-EC weekly job (`services/wgarm-ec/`)
6. Mirror frontend reads from `mirror_candidates` — never live-query as primary path
7. Remove positive counterexample logic from Mirror (moved to Stärke)

Steps 3–7 are Phase 2. They MUST NOT be started until project lead explicitly confirms Phase 2 go-ahead.

---

## Dev mode

When `NEXT_PUBLIC_MIRROR_DEV_MODE=true`:

- Mirror MUST re-run Phase-1 detectors on every page open
- Mirror MUST run WGARM-EC on every page open when ≥10 entries have embeddings
- Mirror MUST pick the strongest candidate across Phase-1 + WGARM-EC for display
- Mirror MUST NOT read from `mirror_candidates` for display
- Results MUST still be persisted to `mirror_candidates` (for analysis)
- Client loading animation MUST be identical in dev and production mode

When unset: existing logic (`mirror_candidates` first, then live detection).

---

## Mirror UI (`MirrorFlow.tsx`)

Normative language per RFC 2119.

### Loading screen

- MUST use app design tokens (`--background` / `--bg-base`, `--foreground` / `--text-primary`)
- MUST show loading copy sequentially (not all at once):
  - „Lese deine Einträge…"
  - „Suche nach Mustern…"
  - „Gleiche Zeiträume ab…"
  - „Bereite deinen Spiegel vor…"
- MUST NOT use a dedicated dark canvas (`#0D0A07` or similar)
- MUST NOT reveal all status lines immediately

### Content

- MUST use app tokens for surfaces and text: `--background`, `--foreground`, `--card` / `--bg-card`, `--border`
- Timeline spine markers MAY be slightly larger than prototype defaults

### Wenn-Dann

- MUST use existing `Input`, `Button`, and `Badge` components
- Primary action: `Button` primary variant; dismiss: `Button` ghost variant
- Reminder chips: `Badge` (toggle via button wrapper)
- MUST NOT use inline hardcoded colors or bespoke form controls

### Entry cards (Mirror content)

- MUST use existing `EntryDisplay` — compact/chips variant (`chips-closed` or equivalent), `menu={false}`
- MUST show meta chips when present
- MUST show date and time on one line, right-aligned: `15. MAI 2026  ·  12:05`
- MUST NOT use bespoke card markup or inline card styles

### Timeline markers

- MUST be at least 20×20 px

### Transition copy between entry cards

Italic, small, muted (`--foreground` muted / `text-ink-3`). MUST map by day gap between consecutive cards:

| Gap | Text |
|-----|------|
| `< 14` days | „Kurz darauf." |
| `< 60` days | „Einen Monat später." |
| `< 180` days | „{n} Monate später." (`n = round(days / 30)`) |
| `< 365` days | „Ein halbes Jahr später." |
| `≥ 365` days | „Fast ein Jahr später." |

---

## valence_shift detector

Normative language per RFC 2119. Requires entry embeddings (semantic clusters from WGARM-EC pipeline).

### Algorithm

For each semantic cluster with **≥ 4 entries** and span **≥ 30 days** (by `created_at`):

1. Sort cluster members by `created_at` ascending
2. Split into **early** / **late** half by index (not by count threshold): `early = [0 .. mid)`, `late = [mid .. n)`
3. `early_avg` = mean `grid_x` (normalized −1…+1) of early half
4. `late_avg` = mean `grid_x` of late half
5. `shift = late_avg − early_avg`
6. If `|shift| > 0.35` → emit candidate

### Signal strength

| Condition | `signal_strength` |
|-----------|-------------------|
| `\|shift\| > 0.6` | `strong` |
| `\|shift\| > 0.35` | `moderate` |

### Source and metadata

- `source = 'valence_shift'`
- `pattern_metadata` MUST include: `entry_early`, `entry_late`, `shift`, `early_avg`, `late_avg`, `cluster_id`, `span_days`, `occurrence_count`, `anchor_entry_ids: [entry_early, entry_late]`
- **Representative entry** per half: member whose embedding has highest cosine similarity to the half’s centroid (fallback: closest `grid_x` to half mean)

### Template text — MUST be neutral (no evaluation)

| Condition | `intro_text` / `template_text` |
|-----------|-------------------------------|
| `shift > 0.35` (early more negative) | „In Momenten wie diesen hat sich etwas verändert. Früher klang das schwerer." |
| `shift < −0.35` (late more negative) | „In Momenten wie diesen klingt es zuletzt anders als noch vor einigen Monaten." |

MUST NOT use evaluative phrasing („Es geht dir besser", „Du hast Fortschritte gemacht", „Es wird schlechter", etc.).

### Mirror display

1. Entry card — early anchor (date/time header)
2. Transition line (see **Transition copy** table above)
3. Entry card — late anchor
4. Pattern text (`introText`)
5. Question: **„Was hat sich verändert?"**

Stärke MAY reuse the same candidate with different copy (out of scope here).

### Implementation split

- **`lib/wgarmEc.ts`**: cluster scan, shift math, templates, `ValenceShiftCandidate[]`
- **`lib/patternDetection.ts`**: `MirrorSource` includes `valence_shift`; `MirrorCandidate` carries early/late entries; adapter from WGARM output
- **`scripts/test-mirror.ts`**: MUST list `valence_shift` candidates alongside Phase-1 and WGARM-EC

---

`scripts/test-mirror.ts` — run with `npm run test:mirror`

- MUST connect via existing Supabase env vars
- MUST run all Phase-1 detectors against real DB data immediately
- MUST run WGARM-EC when ≥10 entries have embeddings (`lib/wgarmEc.ts`, no Python subprocess)
- MUST print all candidates sorted by `signal_strength`

When `NEXT_PUBLIC_MIRROR_DEV_MODE=true` (read from `.env.local`):

- `npm run test:mirror` without `--email` MUST default to user `mirror-test@local.dev`
- MUST connect to local Supabase (`supabase status`), not production URL from `.env.local`
- Local Supabase MUST be running (`supabase start`); script MUST exit with a clear error if not
- Explicit `--email` still overrides the default user; connection stays local while dev mode is on

---

## Out of scope

- Stärke feature implementation
- Notification/reminder system
- Mirror frontend redesign (timeline spine prototype exists separately)
