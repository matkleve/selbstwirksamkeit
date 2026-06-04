/** @deprecated Use `buildMirrorClosureMessages` — kept for tests/legacy refs */
export const MIRROR_SUMMARY_TEXT = 'Du hast heute hingeschaut. Das zählt.'

export type MirrorClosureMode = 'reminder' | 'no_reminder' | 'session_only'

export function buildMirrorClosureMessages(mode: MirrorClosureMode): string[] {
  switch (mode) {
    case 'reminder':
      return [
        'Hey — ich hab dir diesen Reminder angelegt. Ich melde mich in den kommenden Tagen bei dir.',
        'Deine Einträge aus diesem Spiegel habe ich für dich hinterlegt.',
      ]
    case 'no_reminder':
      return [
        'Deine Einträge und dein Wenn-Dann habe ich für dich hinterlegt.',
      ]
    case 'session_only':
      return ['Deine Einträge aus diesem Spiegel habe ich für dich hinterlegt.']
  }
}

export const MIRROR_LOADING_STEPS = [
  'Lese deine Einträge…',
  'Suche nach Mustern…',
  'Gleiche Zeiträume ab…',
  'Bereite deinen Spiegel vor…',
] as const

/** Minimum loader duration when opened from landing (matches network loader step timing). */
export const MIRROR_LOADER_MIN_MS = 3200

export const MIRROR_EXHAUSTED_TEXT =
  'Du hast alle aktuellen Erkenntnisse gesehen. Wir schauen, ob bald wieder neue für dich da sind.'

/** UI labels — non-calendar; maps to DB `reminder_type` / expiry in MirrorFlow. */
export const MIRROR_REMINDER_OPTIONS = [
  { label: 'Heute', reminderType: 'today' as const },
  { label: 'Ein paar Mal', reminderType: '3days' as const },
  { label: 'Eine Weile', reminderType: '7days' as const },
  { label: 'Lieber nicht', reminderType: null },
] as const

export type MirrorReminderLabel = (typeof MIRROR_REMINDER_OPTIONS)[number]['label']

export function reminderTypeForLabel(
  label: string | null,
): 'today' | '3days' | '7days' | null {
  if (!label) return null
  return MIRROR_REMINDER_OPTIONS.find(o => o.label === label)?.reminderType ?? null
}

export const MIRROR_REMINDER_INTROS = [
  'Soll ich dich daran erinnern?',
  'Ich kann dir einen Reminder setzen.',
  'Willst du, dass ich dich erinnere?',
  'Magst du, dass ich dich nochmal anspreche?',
] as const

export function pickMirrorReminderIntro(): (typeof MIRROR_REMINDER_INTROS)[number] {
  return MIRROR_REMINDER_INTROS[Math.floor(Math.random() * MIRROR_REMINDER_INTROS.length)]!
}
