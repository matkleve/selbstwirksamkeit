# Research & Design Ideas

Theoretical grounding and feature concepts for Selbstwirksamkeit.

---

## Bandura's Self-Efficacy Theory (1977)

Core claim: belief in one's own competence is the strongest predictor of whether someone attempts difficult goals and persists through setbacks.

**Four sources of self-efficacy** (in descending strength):

1. **Mastery experiences** — actually succeeding at something. The most powerful source. The app targets this directly.
2. **Vicarious experiences** — seeing similar others succeed ("if they can, I can").
3. **Social persuasion** — encouragement from credible others.
4. **Physiological/affective states** — interpreting low arousal as calm competence rather than weakness.

**Why the framing "Das war erst vor 3 Tagen — vertrau dir" works:**
Bandura showed that people systematically underestimate how recently their mastery experiences occurred. The temporal reframe ("erst vor X Tagen") directly counters *temporal discounting of past success* — the cognitive bias where older achievements feel less "real" or less relevant to current challenges.

**What Bandura would want from the app:**
- The reminder system needs to surface entries at moments of doubt, not just randomly. A purely random draw wastes attention budget. Entries linked to current context (same category as a current struggle) would be far more potent.
- The "Erfolge heute / Tage in Folge" counters are good — they make progress visible. Bandura would note that streaks build *performance accomplishment evidence*, a concrete input to efficacy beliefs.
- The category system matters more than it might seem: efficacy is domain-specific. A `studium` win does not directly transfer to `persönlich`. Seeing wins in a specific domain before a challenge in that same domain is what actually moves the needle.

---

## Spaced Repetition (Ebbinghaus / Wozniak / SM-2)

Ebbinghaus's forgetting curve (1885): memory retention decays exponentially but is fully restored — and the curve flattened — by a well-timed review.

SuperMemo-2 (Wozniak, 1987) formalised the optimal spacing: after first encoding, review at ~1 day, then ~6 days, then 14, 33, 85… The interval roughly doubles each successful recall.

**How to apply this to mastery experiences:**

The key insight is that a past success you *can't vividly recall* has no efficacy value at the moment you need it. The goal is not to store more entries — it's to keep the most important ones salient at the right time.

### Proposed implementation

Add a `review_data` column to the `entries` table:

```sql
alter table entries
  add column review_data jsonb not null default '{"interval":1,"ease":2.5,"due":"now"}'::jsonb;
```

Fields (SM-2 compatible):
- `interval` — days until next review (starts at 1)
- `ease` — ease factor, starts at 2.5, adjusts based on response
- `due` — ISO timestamp of next scheduled review

**Minimal UI (no rating needed):**
Instead of asking the user to rate recall quality (0–5 like Anki), use binary feedback:
- "Ja, das steckt noch in mir" → good recall → interval ×ease, ease stays
- "Hatte ich vergessen" → lapse → interval reset to 1, ease −0.2

After each response, compute next due date and update `review_data` in Supabase.

**"Erinnere mich" tab** becomes a review queue: show the entry whose `due` timestamp is earliest. When the queue is empty, show the closest upcoming entry. The current random-pick fallback can remain when no entries are due.

### Why binary is better than 5-step rating here
The user is not memorising facts — they are accessing emotional memory of a *feeling of competence*. Whether that feeling is accessible right now is a yes/no question. Forcing a 0–5 rating would feel clinical and break the warmth of the experience.

---

## Other concepts worth exploring

### Implementation intentions (Gollwitzer, 1999)
"When X happens, I will remember Y." Letting users optionally attach a trigger to an entry ("Wenn ich vor einer Prüfung nervös bin, erinnere mich an: …") could prime the retrieval path. Push notification hooks at user-defined times would be the simplest technical surface.

### Narrative identity (McAdams, 1993)
People who frame their life as a story with setbacks that were overcome show higher resilience. A "Mein Jahr" view — a timeline of entries grouped by month — would let the user see the narrative arc of their progress over time.

### Flow & optimal challenge (Csikszentmihalyi)
The dashboard streak and entry count are good, but they only measure volume. An optional weekly reflection ("Was war diese Woche mein härtester Erfolg?") would shift attention to difficulty of mastery, which Bandura treats as a stronger efficacy signal than sheer quantity.

---

## Feature backlog (research-grounded)

| Feature | Research basis | Effort |
|---|---|---|
| SRS review queue in "Erinnere mich" | Ebbinghaus / SM-2 | Medium — needs DB migration + `review_data` logic |
| Category-scoped reminders | Bandura domain-specificity | Low — filter pool by active category |
| Push notifications at user-set times | Implementation intentions | Medium — Web Push API + service worker |
| Monthly timeline view | Narrative identity | Low–medium — pure UI |
| Weekly "hardest win" prompt | Csikszentmihalyi / Bandura | Low — extra field on entry |
