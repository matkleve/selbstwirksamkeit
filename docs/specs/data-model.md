# Data Model

## Tables

### `entries`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | auto |
| `user_id` | uuid FK → auth.users | RLS: only own rows |
| `text` | text | reflection text |
| `grid_x` | numeric(3,1) | −5..+5, valence axis |
| `grid_y` | numeric(3,1) | −5..+5, referenz axis (neg=self, pos=other) |
| `reframe` | text nullable | CBT reframe text |
| `person` | text nullable | person context chip |
| `location` | text nullable | location context chip |
| `activity` | text nullable | activity context chip |
| `body_state` | enum nullable | 'stressed' \| 'calm' \| 'tired' |
| `created_at` | timestamptz | server default now() |

### `persons`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `name` | text | unique per user |
| `created_at` | timestamptz | |

### `locations`
Same structure as `persons`.

### `activities`
Same structure as `persons`.

### `user_settings` (planned)
| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK FK | one row per user |
| `reminder_time` | time nullable | daily reminder HH:MM |
| `reminder_enabled` | boolean | default false |
| `timezone` | text | e.g. 'Europe/Berlin' |
| `updated_at` | timestamptz | |

### `mirror_sessions`

Normative schema: `mirror-page.md` §4. Migration: `011_mirror_sessions_history.sql`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | RLS |
| `created_at` | timestamptz | |
| `pattern_type` | text | Same as `mirror_candidates.source` |
| `pattern_text` | text | Insight text shown |
| `anchor_entry_ids` | uuid[] | Entries displayed in mirror |
| `user_response` | text nullable | Reflection |
| `intention_wenn` | text nullable | Wenn-Dann trigger |
| `intention_dann` | text nullable | Wenn-Dann action |
| `reminder_type` | text nullable | `today` \| `3days` \| `week` |
| `is_favorited` | boolean | default false |
| `signal_strength` | text | weak \| moderate \| strong |

### `mirror_candidates`

Pre-generated insights. Writers and fetch rules: `mirror-page.md` §2.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | RLS |
| `entry_ids` | uuid[] | Anchor entries (= session `anchor_entry_ids`) |
| `source` | text | tag_frequency \| grid_cluster \| embedding_temporal \| wgarm_ec \| … |
| `signal_strength` | text | weak \| moderate \| strong — only strong/moderate stored by jobs |
| `intro_text` | text nullable | Phase 1 display |
| `question` | text nullable | Open question |
| `template_text` | text nullable | WGARM-EC rule text |
| `pattern_metadata` | jsonb nullable | |
| `shown` | boolean | default false |
| `shown_at` | timestamptz nullable | |
| `user_reaction` | text nullable | confirmed \| dismissed |
| `created_at` | timestamptz | |

**Dedup key (60 days):** `(source, entry_ids)` must not be re-inserted if already present in `mirror_sessions` for that user within 60 days.

### `implementation_intentions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `wenn_text` | text | |
| `dann_text` | text | |
| `wants_reminder` | boolean | |
| `reminder_type` | text nullable | today \| 3days \| 7days \| until_entry |
| `active` | boolean | |
| `fired_count` | int | |
| `expires_at` | timestamptz nullable | |
| `created_at` | timestamptz | |

## RLS Policies

All tables: `select/insert/update/delete` restricted to `auth.uid() = user_id`.

## Key Computed Values (application layer)

```typescript
// Quadrant (4 zones)
getQuadrant(entry) → 'pos-other' | 'pos-self' | 'neg-other' | 'neg-self' | null

// Zone (8 zones — quadrant × strength)
getZone(x, y) → ZoneKey  // mild/strong × pos/neg × ich/andere

// Valence colour (discrete, for chart lines and borders)
getValenceColor(grid_x) → CSS var string

// Bilinear interpolation colour (continuous, for card tinting)
bilinearColor(x, y) → [r, g, b]
```
