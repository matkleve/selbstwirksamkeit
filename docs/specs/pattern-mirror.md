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
- Output describes interval + span: „müde kommt alle ~5 Tage vor — 8× seit Januar"

**Detector 2 — Grid cluster**
- ≥3 entries in the same valence quadrant (±ich / ±andere) across full entry history
- Input: `grid_x`, `grid_y`, `created_at` — **no time-window filter**
- Signal: `mirror_candidates.source = 'grid_cluster'`

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

## Test script

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
