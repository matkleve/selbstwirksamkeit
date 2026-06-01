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
