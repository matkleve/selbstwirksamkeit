# Motivation Page — Research-Backed Insights

## Theoretical Foundation

### 1. Bandura's Self-Efficacy Theory (1977)
Self-efficacy — belief in one's ability to succeed — is built through four sources:
- **Mastery experiences**: past successes are the strongest source
- **Vicarious learning**: observing others succeed (not yet implemented)
- **Social persuasion**: verbal encouragement (reflected in positive-other quadrant entries)
- **Physiological states**: body awareness (body_state field)

**App implementation**: surface past positive entries as "Mastery Moments", show
correlation between body states and efficacy, highlight "social support" entries.

### 2. Cognitive Behavioural Therapy (CBT)
Core CBT loop: Thought → Emotion → Behaviour → Thought...
Negative automatic thoughts (NATs) can be identified and reframed.

**App implementation**: negative entries without reframes are candidates for CBT
reframing exercises. Show before/after reframe pairs as progress evidence.

### 3. Positive Psychology (Seligman — PERMA)
- Positive emotions, Engagement, Relationships, Meaning, Achievement
- grid_x > 0 maps to Positive Emotions
- grid_y > 0 maps to Relationships (other-focus)
- Streaks map to Achievement and Engagement

**App implementation**: PERMA radar derived from recent 30-day entry patterns.

### 4. Acceptance and Commitment Therapy (ACT)
Psychological flexibility — ability to stay present and act according to values
even when experiencing difficult thoughts/feelings.

**App implementation**: show how the user has "shown up" even on difficult days
(negative entries that have reframes = ACT-style acceptance + committed action).

## Page Sections

### Abschnitt 1: "Deine Stärken dieser Woche"
- Count of mastery moments (grid_x ≥ 3 in last 7 days)
- Longest positive streak
- Social support moments (grid_x > 0 AND grid_y > 0)
- A randomly selected positive entry (past 30 days) shown as encouragement

### Abschnitt 2: "Was deine Daten dir sagen"
Research-backed pattern insights (only shown if enough data):
- Body state with highest average valence: "Wenn du [state] bist, fühlst du dich im Schnitt am stärksten."
- Time of day with most positive entries: "Deine besten Einträge entstehen meist am [time]."
- Person/location correlating with positive valence (if data available)
- ACT insight: "Von [N] schwierigen Momenten hast du [M] davon reflektiert." (reframe rate)

### Abschnitt 3: "Übungen für heute"
Rotates through 3 evidence-based micro-exercises based on user's current pattern:
- **If mostly neg-self recently**: 5-minute strengths inventory (list 3 things you did well)
- **If mostly neg-other recently**: compassion meditation prompt (perspective-taking)
- **If low entry count**: brief check-in prompt ("Wie geht es dir gerade in einem Satz?")
- **If positive streak**: gratitude amplification ("Was hat zu diesem Wohlbefinden beigetragen?")

### Abschnitt 4: "Reframe-Übung"
One negative entry from >7 days ago without a reframe, presented as:
"Wie siehst du das heute?" — with a textarea to add the reframe.

## Data Requirements
- Minimum 5 entries for any pattern insight to show
- Body state patterns: minimum 3 entries per state
- All insights are derived only from the authenticated user's own data
- No external data, no ML model — pure statistical patterns

## Future Extensions
- Weekly summary email/push notification
- Therapist-export (anonymised pattern PDF)
- Peer comparison (opt-in, anonymised)
- Journaling prompts from validated therapeutic frameworks
