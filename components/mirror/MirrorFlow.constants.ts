export const MIRROR_SUMMARY_TEXT = 'Du hast heute hingeschaut. Das zählt.'

export const MIRROR_LOADING_STEPS = [
  'Lese deine Einträge…',
  'Suche nach Mustern…',
  'Gleiche Zeiträume ab…',
  'Bereite deinen Spiegel vor…',
] as const

/** Minimum loader duration when opened from landing (matches network loader step timing). */
export const MIRROR_LOADER_MIN_MS = 3200

export const MIRROR_EXHAUSTED_TEXT =
  'Du hast alle aktuellen Erkenntnisse gesehen. Nächste Woche gibt es neue.'

export const MIRROR_REMINDER_OPTIONS = ['Heute', '3 Tage', 'Diese Woche', 'Kein Reminder'] as const

export const MIRROR_REMINDER_INTROS = [
  'Soll ich dich daran erinnern?',
  'Ich kann dir einen Reminder setzen.',
  'Willst du, dass ich dich erinnere?',
  'Magst du, dass ich dich nochmal anspreche?',
] as const

export function pickMirrorReminderIntro(): (typeof MIRROR_REMINDER_INTROS)[number] {
  return MIRROR_REMINDER_INTROS[Math.floor(Math.random() * MIRROR_REMINDER_INTROS.length)]!
}
