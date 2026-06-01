# Feature Specifications

## Entry Grid
- Square, fills card width, `aspect-ratio: 1`
- Inset box-shadow for recessed look (no outer border)
- Background: `radial-gradient` dot pattern, 28px spacing, stone-300 dots
- Axis labels OUTSIDE grid: top = Users icon + "andere", bottom = User icon + "ich",
  left = "−" (stone-300), right = "+" (stone-300)
- Interaction: **pointer drag** (works on touch + mouse), `setPointerCapture`
- Active dot: 10px circle, colour = bilinear interpolation of 4 pole colours
- Dot glow: `box-shadow` with two layers of soft radial glow
- **Trail**: last 12 drag positions rendered as SVG polyline, opacity 0.4,
  fades out in 600ms after pointer release
- Card background tint: `inset 0 0 0 1000px rgba(r,g,b,0.10)` box-shadow
  based on bilinear colour — no reflow, transitions 300ms
- Default position: (0, 0) — neutral white tint

## Quote Zones (8 zones)
Grid divided into 8 zones: 4 quadrants × mild (euclidean dist < 2.5) / strong (≥ 2.5).
10 texts per zone (80 total). Fade out/in on zone change (200ms).

Zone keys: `mild_neg_ich`, `strong_neg_ich`, `mild_pos_ich`, `strong_pos_ich`,
`mild_neg_andere`, `strong_neg_andere`, `mild_pos_andere`, `strong_pos_andere`

## Chip Inputs (Person / Ort / Tätigkeit)
- Resting state: pill button with `+` icon and label
- On tap: expands inline to `<input>` with `<datalist>` autocomplete
  from `persons` / `locations` / `activities` Supabase tables
- Filled state: shows value + ✕ to clear
- On entry save: upserts the value into the corresponding entity table

## Reframe Flow
- Triggered when submitted entry has `grid_x < 0`
- Appears inline below entry (no modal)
- "Wie könntest du das anders sehen?" + textarea
- Buttons: Überspringen, Speichern
- Saved value stored in `entries.reframe`

## Dashboard (5 cards)
1. **Wochenbalance** — count positive/negative entries this week
2. **Valence-Verlauf** — recharts line chart, 14 days, gradient line (blue>0, terracotta<0),
   custom tooltip shows entry text on hover
3. **Quadranten-Häufigkeit** — 2×2 grid, entry counts, intensity = frequency
4. **Body State Muster** — shown only if ≥3 entries per state AND ≥2pt valence gap
5. **Letzte Einträge** — 3 compact timeline preview cards, link to full timeline

## Motivation (research-backed)
See `motivation.md` for full spec.

## Notifications
- Push reminder via Web Notifications API (requires user permission)
- Daily reminder time stored in `user_settings` Supabase table
- Fallback: in-app nudge card when user opens app
- Currently: settings UI + permission request (push delivery TBD)

## Timeline
- Compact coloured-dot strip grouped by day at top
- Full entry cards below
- Each card: 3px left border in valence colour
- Reframe text shown kursiv if present
- Body state hint sentence if `body_state` present
- "Wie siehst du das heute?" link for negative entries >3 days old without reframe
