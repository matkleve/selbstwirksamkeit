export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

export function calcStreak(entries: { created_at: string }[]): number {
  if (!entries.length) return 0
  const days = new Set(entries.map(e => {
    const d = new Date(e.created_at)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }))
  let streak = 0
  const now = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (days.has(key)) streak++
    else if (i > 0) break
  }
  return streak
}

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

export function nudgeText(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Das war heute — du schaffst das regelmäßig.'
  if (days <= 3) return 'Noch nicht mal eine Woche her — vertrau dir!'
  if (days <= 7) return 'Erst letzte Woche — das steckt noch frisch in dir.'
  if (days <= 30) return 'Erst diesen Monat — das bist immer noch du.'
  return 'Das hast du wirklich geschafft — und du schaffst wieder Neues.'
}

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
