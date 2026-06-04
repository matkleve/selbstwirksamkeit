# Implementation-Intention Reminders

RFC 2119 | Companion: `docs/science/implementation-intentions.md`

---

## UI — Reminder block timing

The Reminder block MUST appear only **after** the user taps **Weiter** on the
Wenn-Dann row (both fields filled). MUST NOT show while the user is still editing
Wenn/Dann.

Second **Weiter** on the Reminder row saves the intention (optional chip) and
continues to Summary.

## UI — Intro vor Reminder-Chips

When the Reminder block is visible, it MUST show one intro line **above** the
chips (same timeline row, not a separate block).

One of four variants, chosen at random when the block mounts:

- „Soll ich dich daran erinnern?"
- „Ich kann dir einen Reminder setzen."
- „Willst du, dass ich dich erinnere?"
- „Magst du, dass ich dich nochmal anspreche?"

Style: small, italic, muted (`--muted-foreground`).

Implementation: `components/mirror/MirrorFlow.reminder.tsx`, `MIRROR_REMINDER_INTROS`.

---

## Notification body copy

Scientific basis: full WENN+DANN on first exposure reactivates declarative memory
(Pirolli et al. 2017; Wicaksono et al. 2019). DANN-only later assumes context is encoded.

### Tag 1 (`fired_count === 0`)

First notification only. MUST include full plan:

```
Wenn {wenn_text} —
{dann_text}.
```

Two lines. No extra words.

### Tag 2–3 (`fired_count === 1` or `2`)

```
{dann_text}.
```

Action only — context assumed in memory.

### Tag 4+ (`fired_count >= 3`)

MUST NOT send a notification. MUST set `active = false`.
Silence beats ineffective repetition (Pirolli: time since last confirmation).

---

## Invariants

```
MUST NOT: "Du weißt...", "Vergiss nicht...", "Du wolltest..."
MUST NOT: Motivational or coaching tone
MUST NOT: More than two lines in notification body
MUST:     Tag 1 always WENN + DANN together
MUST:     Stop after 3 fires OR expires_at — whichever comes first
MUST:     active = false when reminder period ends
```

Text builder: `lib/intentionReminderText.ts`.

---

## Database (`implementation_intentions`)

| Field | Role |
|-------|------|
| `wants_reminder` | User opted in via chip (not „Lieber nicht") |
| `reminder_type` | `today` · `3days` · `7days` |
| `fired_count` | Incremented on each delivery |
| `expires_at` | Set on insert from `reminder_type` |
| `active` | false after expiry or `fired_count >= 3` |

Delivery scheduler: future work (cron / push). Text rules MUST be enforced in
`intentionNotificationText()` before any send.

---

## Chip → expiry

| Chip (UI label) | `reminder_type` | `expires_at` |
|-----------------|-----------------|--------------|
| Heute | `today` | End of local day |
| Ein paar Mal | `3days` | `created_at + 3d` (max 3 fires) |
| Eine Weile | `7days` | `created_at + 7d` |
| Lieber nicht | — | `wants_reminder = false` |

UI labels MUST NOT use calendar phrasing („3 Tage“, „Diese Woche“) — non-direktive,
duration-agnostic copy.

Max **3** notification fires per intention regardless of chip duration.
