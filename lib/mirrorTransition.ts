/** Transition copy between Mirror entry cards (see docs/specs/pattern-mirror.md). */
export function mirrorTransitionText(earlierIso: string, laterIso: string): string {
  const days = Math.floor(
    (new Date(laterIso).getTime() - new Date(earlierIso).getTime()) / (24 * 60 * 60 * 1000),
  )
  if (days < 14) return 'Kurz darauf.'
  if (days < 60) return 'Einen Monat später.'
  if (days < 180) {
    const n = Math.max(1, Math.round(days / 30))
    return `${n} Monate später.`
  }
  if (days < 365) return 'Ein halbes Jahr später.'
  return 'Fast ein Jahr später.'
}

export function formatMirrorDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate()
  const month = d.toLocaleDateString('de-DE', { month: 'long' }).toUpperCase()
  const year = d.getFullYear()
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return `${day}. ${month} ${year}  ·  ${time}`
}
