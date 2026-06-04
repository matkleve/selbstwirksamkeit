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
- **60-day session dedup (normative):** before insert, MUST NOT write a candidate if `mirror_sessions` already contains the same `(pattern_type = 'wgarm_ec', anchor_entry_ids = entry_ids)` within the last 60 days. See `mirror-page.md` §2.1.
- MUST NOT insert `signal_strength = 'weak'`
- Dev mode (`NEXT_PUBLIC_MIRROR_DEV_MODE=true`): WGARM-EC runs on every Mirror open (on-demand), not from cache

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

## Temporal span

MUST NOT emit a mirror candidate when `span_days < 7` (pattern lacks meaningful time distance).

## Tag namespaces (transaction items)

| Field | Item prefix | Template branch |
|---|---|---|
| `person` | `tag:person:{name}` | Person template |
| `body_state` | `tag:mood:{value}` | Mood template |
| `location` | `tag:loc:{value}` | Location template |
| `activity` | `tag:act:{value}` | Default / combined |

MUST NOT show raw item keys (`time:evening`, `tag:mood:calm`) in `template_text`. Use German labels (`abends`, `ruhig`).

## Cluster labels

Cluster label MUST only be set when `valenceBias` is unambiguous (`positive` or `negative`, not `mixed`).  
Label source: dominant `body_state` tags in cluster members (not person names).

Cluster-only rules without a usable label MUST NOT become mirror candidates.

## Mirror invariants

MUST NOT show positive counterexamples in Mirror context. MUST NOT claim causality.

---

## Template bugs (fixed in `lib/wgarmEc.ts`)

Previously documented defects — resolved in TypeScript port:

1. **Person vs mood tags** — namespaced items (`tag:person:` / `tag:mood:`) with separate templates.
2. **Empty antecedent in default template** — cluster-only rules without label are filtered out; default branch uses human-readable labels only.
3. **Rule deduplication** — subset-dominance dedup (drop strict superset when higher-lift subset exists) plus `template_text` dedup.
4. **Raw field names** — `formatItemLabel()` maps time/weekday/tag items to German text.
5. **Short span** — `span_days < 7` rules are excluded.
