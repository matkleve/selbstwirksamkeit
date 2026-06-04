# Design System

## Principles
- Warm off-white canvas (`#F7F6F3`), white cards with very soft shadow
- DM Sans 400/500/600 for all UI; DM Serif Display italic for quotes and titles
- Never font-weight below 400
- No neon colours, no glassmorphism
- Primary action button: stone-900 background, off-white text

## Colour Tokens (CSS variables)

### Surfaces
| Token | Light | Dark |
|---|---|---|
| `--bg-base` | `#F7F6F3` | `#1A1816` |
| `--bg-card` | `#FFFFFF` | `#221F1C` |
| `--bg-subtle` | `#F0EDE8` | `#2A2724` |

### Typography
| Token | Light | Dark |
|---|---|---|
| `--text-primary` | `#1C1917` | `#F0EBE5` |
| `--text-secondary` | `#6B6460` | `#9C9088` |
| `--text-muted` | `#A09890` | `#605850` |
| `--text-inverse` | `#FAFAF8` | `#1C1917` |

### Valence Colours
Used to tint entry cards and chart lines based on `grid_x` value.

| Token | Light (blue=pos / terracotta=neg) |
|---|---|
| `--valence-pos-strong` | `#3B7DD8` |
| `--valence-pos-mid` | `#6FA3E0` |
| `--valence-pos-weak` | `#A8C4E8` |
| `--valence-neg-strong` | `#C4603A` |
| `--valence-neg-mid` | `#D4886A` |
| `--valence-neutral` | `#C4B9AE` |

### Bilinear Grid Pole Colours
Used for card background tinting via inset box-shadow + bilinear interpolation across
the 2D grid. Very desaturated — only 10% opacity over card white.

| Quadrant | RGB |
|---|---|
| neg/ich (x<0, y<0) | `rgb(186, 144, 82)` — warm ochre |
| pos/ich (x>0, y<0) | `rgb(72, 168, 158)` — muted teal |
| neg/andere (x<0, y>0) | `rgb(168, 118, 128)` — dusty mauve |
| pos/andere (x>0, y>0) | `rgb(140, 120, 188)` — muted violet |

### Typography

**Semantic tags** (`@layer base` in `globals.css`) — site-wide, no extra classes needed:

| Tag | Font | Notes |
|---|---|---|
| `h1` | DM Serif Display, italic, 1.5rem | Page titles |
| `h2` | DM Serif Display, italic, 1.0625rem | Section headings |
| `h3` | DM Sans, 1rem, medium | Subsection |
| `h4`–`h6` | DM Sans, 0.875rem, medium, secondary | Minor headings |
| `p` | inherits body | margin reset to 0 |
| `blockquote` | DM Serif Display, italic, secondary | |
| `header > h1 + p` | body, secondary | intro under page title |

**Custom roles** (`@layer components`) — use when semantics don't fit:

| Class | Use |
|---|---|
| `.section-label` | Uppercase card section caption (Dashboard, Motivation, …) |
| `.text-lead` | Standalone intro paragraph |
| `.text-quote` | Grid quote, entry excerpts, hints — display italic |

Local overrides (Tailwind utilities, inline layout) are fine on top of the base tags.
| Token | Value |
|---|---|
| `--radius-form` | `1.125rem` |
| `--radius-card` | `0.875rem` |
| `--radius-field` | `0.5625rem` |
| `--radius-chip` | `62.5rem` (pill) |

## Component Catalogue
- `components/ui/button.tsx` — variants: primary, ghost, link; sizes: sm, md, lg
- `components/ui/input.tsx` — with error state
- `components/ui/textarea.tsx` — with error state
- `components/ui/card.tsx` — base card wrapper
- `components/ui/badge.tsx` — variants: default, filled
- `components/ui/label.tsx`
- `components/EntryGrid.tsx` — interactive 2D grid with drag, trail, bilinear colour
- `components/BottomTabBar.tsx` — 4-tab fixed bottom navigation
- `components/MenuDropdown.tsx` — menu icon + sign-out dropdown
- `components/AppShell.tsx` — page wrapper (header + tab bar)
- `components/ValenceChart.tsx` — recharts line chart with gradient colour
- `components/CalendarHeatmap.tsx` — GitHub-style 16-week heatmap
- `components/TimeOfDayBars.tsx` — 3-period bar chart
