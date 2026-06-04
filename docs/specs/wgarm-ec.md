# WGARM-EC Specification

Weighted Generalized Association Rule Mining with Embedding-Clustering.

Version 1.0 — normative language per RFC 2119.

Full algorithm reference: `services/wgarm-ec/SPEC.md` (source copy from project docs).

## Summary

WGARM-EC replaces naive embedding-pair similarity for Phase 2 pattern detection:

1. **Semantic clustering** — online incremental clustering on entry embeddings (threshold 0.73)
2. **Transaction building** — entries → discrete items (cluster, valence bucket, tags, time, weekday)
3. **FP-Growth** — association rules `{antecedent} → {valence item}` with min support 0.15, confidence 0.60, lift 1.30
4. **Temporal annotation** — span, interval, escalation detection
5. **Template text** — rule → natural language (no LLM for rule text)

Output: `mirror_candidates` rows with `source = 'wgarm_ec'`, `template_text`, `pattern_metadata`.

## Weekly job

- Edge Function: `run-wgarm-ec` (TypeScript, uses `lib/wgarmEc.ts`)
- Schedule: pg_cron `0 3 * * 0` (Sunday 03:00 UTC) via migration `010_wgarm_cron.sql`
- MUST persist top moderate+ candidates (max 3, deduped by `template_text`) with `shown = false`
- Dev mode (`NEXT_PUBLIC_MIRROR_DEV_MODE=true`): WGARM-EC runs on every Mirror page load

## Embeddings

Entry embeddings MUST be generated via Mistral `mistral-embed` (1024 dimensions).  
See `embeddings.md` for API, secrets, and migration requirements.

MUST NOT use OpenAI or Supabase `gte-small` (English-only).

## Grid normalization

App grid uses −5…+5. WGARM-EC expects −1…+1:

```
grid_norm = grid_value / 5
```

## Signal strength

```
strong:   confidence > 0.80 AND lift > 2.0 AND occurrence_count >= 5
moderate: confidence > 0.65 AND lift > 1.5 AND occurrence_count >= 3
weak:     everything else above minimum thresholds
```

## Minimum entries

MUST NOT run with < 10 entries.

## Mirror invariants

MUST NOT show positive counterexamples in Mirror context. MUST NOT claim causality.

---

## Known template bugs (MUST fix before Phase 2 production)

The current `generate_text()` implementation in `services/wgarm-ec/algorithm.py` has three documented defects. These MUST be resolved before WGARM-EC output is shown in Mirror.

### Bug 1 — Person template applied to mood tags

**Symptom:** All `tag:*` antecedents are treated as person names.

```python
persons = [i.split(":")[1].capitalize() for i in ant if i.startswith("tag:")]
# → "Wenn du mit Müde zusammen bist, fühlst du dich unwohl."
```

**Expected:** Person tags (from `entries.person`) MUST use the person template. Mood/feeling tags (body_state, freitext-derived tags) MUST use a separate template or fall through to default.

**Fix requirement:** Tag namespace MUST distinguish `tag:person:{name}` vs `tag:mood:{value}` at transaction-build time, or filter by known person-entity list.

### Bug 2 — Empty antecedent string in default template

**Symptom:** When antecedent contains only `cluster:*` items and no cluster label is set, the default branch produces:

```
Mir ist aufgefallen:  hängt in 100% der Fälle mit positiven Zuständen zusammen.
```

**Cause:** Default template excludes cluster items from `ant_str` but cluster-only rules have nothing else to join.

**Fix requirement:** If `label` is empty and antecedent is cluster-only, MUST use cluster template with generated label (from anchor entries) or MUST NOT emit the rule as a mirror candidate.

### Bug 3 — Missing rule deduplication

**Symptom:** FP-Growth produces overlapping rules with identical or near-identical template text, e.g.:

- `{cluster:C3} → {valence:positiv}`
- `{cluster:C3, tag:stolz} → {valence:positiv}`
- `{tag:stolz} → {valence:positiv}`

All three may surface as separate `mirror_candidates` with redundant Mirror text.

**Fix requirement:** Before writing to `mirror_candidates`, rules MUST be deduplicated by `(consequent, template_text)` keeping the highest-lift rule, or by antecedent subset dominance (drop rules whose antecedent is a strict superset of a higher-lift sibling).
