# Mirror Page — Landing, Pre-Generated Candidates, History

**Version:** 1.0  
**Status:** Draft — awaiting project-lead confirmation before implementation  
**Normative language:** [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) (`MUST`, `MUST NOT`, `SHOULD`, `MAY`)

**Related specs:** `pattern-mirror.md`, `insight-types.md`, `data-model.md`, `wgarm-ec.md`

---

## 1. `/mirror` page layout

### 1.1 Landing state (on page open)

The `/mirror` route MUST render a **landing view**. It MUST NOT auto-start the Mirror flow.

| Element | Requirement |
|---------|-------------|
| Primary action | Centred button **„Spiegel öffnen"** (primary variant) |
| Auto-start | MUST NOT occur — flow starts only after explicit user click |
| History | Mirror History list below the button (§3) |

**Current behaviour (to replace):** Server resolves a candidate on page load and `MirrorFlow` starts immediately with loading animation. This MUST be removed.

### 1.2 After button click

Sequence:

1. User clicks **„Spiegel öffnen"**
2. **Loading animation** — `MirrorNetworkLoader` MUST run to completion (§1.3)
3. **Mirror flow** — `MirrorFlow` with the fetched candidate (§2)
4. **Session persist** — row in `mirror_sessions` (§4)
5. **Return** — user returns to `/mirror` landing; history MUST reflect the new session

**Routing (implementation note):** Landing at `/mirror`; active flow MAY use client state on the same route or a child route (e.g. `/mirror/session`). The URL MUST return to `/mirror` when the user closes or finishes.

### 1.3 Loading animation invariant

`MirrorNetworkLoader` MUST run on every mirror open:

- Production: even when the strongest unshown candidate is available immediately
- Dev mode: even when live detection returns instantly
- Empty pool: animation MUST still complete before the empty-state message (§2.3)

Loading step copy and timing are defined in `MirrorNetworkLoader` (not duplicated here).

---

## 2. Pre-generated candidates

### 2.1 Weekly job (Sunday 03:00 UTC)

The WGARM-EC cron (`run-wgarm-ec`, see `010_wgarm_cron.sql`) is the primary writer of pre-generated candidates. Phase-1 detectors MAY write on other paths; the same rules below apply to **all** writers.

#### Before insert into `mirror_candidates`

Writers MUST check whether the same insight was **already shown** to the user within the last **60 days**:

| Match key | Rule |
|-----------|------|
| `pattern_type` | Same value as candidate `source` (see `data-model.md`) |
| `anchor_entry_ids` | Same set of entry UUIDs (order-independent) |

Query source: **`mirror_sessions`** where `created_at > now() - interval '60 days'`.

If a match exists: the writer MUST NOT insert that candidate into `mirror_candidates`.

#### Signal strength filter

Writers MUST ONLY insert rows with:

- `signal_strength = 'strong'` OR
- `signal_strength = 'moderate'`

Writers MUST NOT insert `signal_strength = 'weak'`.

*(Existing weekly job already filters weak WGARM rules; this rule applies uniformly to all sources.)*

### 2.2 Button-click flow (production)

When the user clicks **„Spiegel öffnen"** (and dev mode is off):

1. Fetch the **strongest unshown** candidate from `mirror_candidates`:
   - `shown = false`
   - `signal_strength IN ('strong', 'moderate')`
   - Sort: `strong` before `moderate`; within the same strength, **newest** `created_at` first
2. Run loading animation (§1.3)
3. Run `MirrorFlow` with that candidate
4. Mark candidate `shown = true`, `shown_at = now()`
5. Create / update `mirror_sessions` (§4)

Production MUST NOT live-run Phase-1 detectors as the primary path when unshown candidates exist.

If no unshown candidate remains after fetch: §2.3 applies (no fallback to live detection in production).

### 2.3 No candidates left (empty pool)

After loading animation completes:

| Element | Requirement |
|---------|-------------|
| Copy | „Du hast alle aktuellen Erkenntnisse gesehen. Nächste Woche gibt es neue." |
| Summary block | MUST NOT appear |
| Actions | Button **„Schließen"** → return to `/mirror` landing |

This state is distinct from **pattern not found** inside a session (`insight-types.md` empty mirror).

### 2.4 Dev mode

When `NEXT_PUBLIC_MIRROR_DEV_MODE=true` (see `lib/mirror-config.ts`):

- Resolution MUST remain **on-demand** (live Phase-1 + WGARM-EC as today)
- Display MUST NOT read unshown rows from `mirror_candidates` as the primary path
- Results MUST still be persisted to `mirror_candidates` for analysis
- Loading animation rules (§1.3) MUST still apply

Server-only `MIRROR_DEV_MODE` without the `NEXT_PUBLIC_` prefix MUST NOT be used for client-visible behaviour.

---

## 3. Mirror history

### 3.1 Data source

History MUST list all `mirror_sessions` for the current user, **newest first**.

Favorited sessions (`is_favorited = true`) SHOULD appear **above** non-favorited sessions, still ordered by `created_at` DESC within each group.

### 3.2 Session card (list item)

Each card MUST show:

| Field | Source |
|-------|--------|
| Date + time | `created_at` (locale formatting) |
| Pattern text | `pattern_text` |
| Anchor entries | Compact read-only entry cards (`EntryDisplay`, `menu={false}`) for `anchor_entry_ids` |
| User response | `user_response` if set — italic, muted |
| Wenn-Dann | If `intention_wenn` and `intention_dann` set: „Wenn {wenn}, dann {dann}." |
| Favourite | ⭐ toggle bound to `is_favorited` |

### 3.3 Session detail (replay)

Tapping a card MUST open the full mirror session in **read-only replay** mode:

- All narrative blocks visible (no word-by-word reveal required in v1; MAY show final state immediately)
- Response blocks shown as recorded (reflection, Wenn-Dann, summary if applicable)
- MUST NOT allow editing reflection or Wenn-Dann
- Favourite toggle MUST remain interactive

### 3.4 Out of scope (v1)

- Deleting sessions
- Sharing / export
- Search or filter beyond favourite pin

---

## 4. Database — `mirror_sessions`

Normative schema after migration `011_mirror_sessions_history.sql`:

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `user_id` | `uuid` FK → `auth.users` | RLS: own rows only |
| `created_at` | `timestamptz` | default `now()` |
| `pattern_type` | `text` | Same semantics as `mirror_candidates.source` |
| `pattern_text` | `text` | Insight text shown (intro or template) |
| `anchor_entry_ids` | `uuid[]` | Entries shown in the mirror |
| `user_response` | `text` nullable | Reflection answer |
| `intention_wenn` | `text` nullable | Wenn-Dann trigger |
| `intention_dann` | `text` nullable | Wenn-Dann action |
| `reminder_type` | `text` nullable | `'today'` \| `'3days'` \| `'week'` |
| `is_favorited` | `boolean` | default `false` |
| `signal_strength` | `text` | `'weak'` \| `'moderate'` \| `'strong'` |

**Deprecated (dropped in migration 011):** `pattern_found`, `question_asked`, `entries_shown`.

### Session write rules

On mirror completion (or when reflection is saved, for partial progress):

- `pattern_type` ← candidate `source`
- `pattern_text` ← `template_text ?? intro_text` (first non-null insight string)
- `anchor_entry_ids` ← candidate `entryIds`
- `signal_strength` ← candidate `signalStrength`
- `user_response`, `intention_wenn`, `intention_dann`, `reminder_type` ← user input when provided

`implementation_intentions` remains the source for active reminders; `mirror_sessions.reminder_type` is a **snapshot** of what the user chose in the mirror flow.

---

## 5. Implementation order & stop points

| Step | Deliverable | Gate |
|------|-------------|------|
| **A** | This spec + migration `011` | **STOP** — project lead confirms |
| **B** | Landing page + button + fetch flow | Screenshot for review |
| **C** | History list + replay + favourite | Screenshot for review |
| **D** | Weekly job 60-day dedup + candidate sort fix | Example query output |

Agents MUST NOT expand scope beyond this document without spec amendment.

---

## 6. Acceptance criteria (summary)

- [ ] `/mirror` shows button + history; no auto-start
- [ ] Every open runs `MirrorNetworkLoader` to completion
- [ ] Production picks strong → moderate, newest first
- [ ] Empty pool shows specified German copy + Schließen
- [ ] Dev mode stays on-demand
- [ ] `mirror_sessions` matches §4 schema
- [ ] History cards and replay match §3
