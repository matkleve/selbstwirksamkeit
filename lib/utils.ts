import type { BodyState } from './types'

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  if (mins < 2) return 'gerade eben'
  if (mins < 60) return `vor ${mins} Minuten`
  if (hours < 24) return `vor ${hours} Stunde${hours > 1 ? 'n' : ''}`
  if (days === 1) return 'gestern'
  if (days < 7) return `vor ${days} Tagen`
  if (weeks === 1) return 'vor einer Woche'
  return `vor ${weeks} Wochen`
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** z. B. „25. März 2026“ */
export function formatEntryDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function getBodyStateHint(body_state: BodyState, grid_x: number | null): string | null {
  if (grid_x === null) return null
  const pos = grid_x > 0
  if (body_state === 'tired' && pos)
    return "Du warst müde — und hast es trotzdem geschafft. Das zählt doppelt."
  if (body_state === 'tired' && !pos)
    return "Du warst müde — denkst du, das hat deine Wahrnehmung beeinflusst?"
  if (body_state === 'stressed' && pos)
    return "Du warst gestresst und hast es trotzdem hingekriegt."
  if (body_state === 'stressed' && !pos)
    return "Du warst gestresst — manchmal färbt das die Sicht ein."
  if (body_state === 'calm' && !pos)
    return "Du warst ruhig — das verdient ehrliche Aufmerksamkeit."
  return null
}

// Kept for auth-form compatibility
export const PASSWORD_RULES = [
  { id: 'length', label: 'Mindestens 8 Zeichen', test: (p: string) => p.length >= 8 },
  { id: 'letter', label: 'Mindestens ein Buchstabe', test: (p: string) => /[a-zA-ZäöüÄÖÜß]/.test(p) },
  { id: 'number', label: 'Mindestens eine Ziffer', test: (p: string) => /\d/.test(p) },
] as const

export function getPasswordChecks(password: string) {
  return PASSWORD_RULES.map(rule => ({ ...rule, met: rule.test(password) }))
}

export function isPasswordValid(password: string) {
  return PASSWORD_RULES.every(rule => rule.test(password))
}
