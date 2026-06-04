/** Template helpers — see docs/specs/insight-types.md */

export type SignalStrength = 'weak' | 'moderate' | 'strong'

export function intensity(count: number): string {
  if (count >= 13) return 'Das begleitet dich schon lange.'
  if (count >= 6) return 'Du kennst das gut.'
  return 'Das taucht immer wieder auf.'
}

export function seasonFromMonth(month: number): string {
  if (month >= 3 && month <= 5) return 'Frühling'
  if (month >= 6 && month <= 8) return 'Sommer'
  if (month >= 9 && month <= 11) return 'Herbst'
  return 'Winter'
}

/** @param since — anchor date for season phrase when span is 180–364 days */
export function timespan(spanDays: number, since?: Date): string {
  if (spanDays < 60) return 'in den letzten Wochen'
  if (spanDays < 180) return 'seit einigen Monaten'
  if (spanDays < 365) {
    const d = since ?? new Date()
    return `seit dem ${seasonFromMonth(d.getMonth() + 1)}`
  }
  return 'seit über einem Jahr'
}

export function confidenceText(confidence: number): string {
  if (confidence > 0.85) return `${Math.round(confidence * 100)}% der Fälle`
  return 'oft'
}

export function strongIntro(signalStrength: SignalStrength): string {
  if (signalStrength === 'strong') return 'Mir ist etwas aufgefallen.\n\n'
  return ''
}

/** Prefix pattern copy with strong intro when applicable. */
export function withStrongIntro(signalStrength: SignalStrength, pattern: string): string {
  const intro = strongIntro(signalStrength)
  const body = pattern.trim()
  return intro ? `${intro}${body}` : body
}
