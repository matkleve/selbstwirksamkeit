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
