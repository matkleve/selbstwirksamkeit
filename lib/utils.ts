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
