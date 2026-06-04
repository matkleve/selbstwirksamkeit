/** Notification copy for implementation intentions — see docs/specs/intention-reminders.md */

const FORBIDDEN_PREFIXES = ['Du weißt', 'Vergiss nicht', 'Du wolltest'] as const

export const INTENTION_REMINDER_MAX_FIRES = 3

export interface IntentionReminderRow {
  wenn_text: string
  dann_text: string
  wants_reminder: boolean
  active: boolean
  fired_count: number
  expires_at: string | null
}

/** Notification body for fire `firedCount` (0 = Tag 1). null = do not send (Tag 4+). */
export function intentionNotificationText(
  wennText: string,
  dannText: string,
  firedCount: number,
): string | null {
  if (firedCount >= INTENTION_REMINDER_MAX_FIRES) return null

  const wenn = wennText.trim()
  const dann = dannText.trim()
  if (!wenn || !dann) return null

  let text: string
  if (firedCount === 0) {
    text = `Wenn ${wenn} —\n${dann}.`
  } else {
    text = `${dann}.`
  }

  assertAllowedNotificationText(text)
  const lines = text.split('\n')
  if (lines.length > 2) return null

  return text
}

export function shouldSendIntentionReminder(
  intention: IntentionReminderRow,
  now = new Date(),
): boolean {
  if (!intention.wants_reminder || !intention.active) return false
  if (intention.fired_count >= INTENTION_REMINDER_MAX_FIRES) return false
  if (intention.expires_at && new Date(intention.expires_at) < now) return false
  return intentionNotificationText(intention.wenn_text, intention.dann_text, intention.fired_count) !== null
}

export function intentionExpiresAt(
  reminderType: 'today' | '3days' | '7days',
  from = new Date(),
): string {
  const d = new Date(from)
  if (reminderType === 'today') {
    d.setHours(23, 59, 59, 999)
    return d.toISOString()
  }
  const days = reminderType === '3days' ? 3 : 7
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function assertAllowedNotificationText(text: string): void {
  for (const prefix of FORBIDDEN_PREFIXES) {
    if (text.startsWith(prefix)) {
      throw new Error(`Forbidden notification prefix: ${prefix}`)
    }
  }
}
