/**
 * WGARM-EC — TypeScript port of services/wgarm-ec/algorithm.py
 * See docs/specs/wgarm-ec.md and services/wgarm-ec/SPEC.md
 */

export interface WgarmEntry {
  id: string
  created_at: Date
  grid_x: number
  grid_y: number
  mood_tags: string[]
  hour_of_day: number
  day_of_week: number
  text: string
  embedding: number[] | null
}

export interface WgarmMirrorCandidate {
  entry_ids: string[]
  source: 'wgarm_ec'
  signal_strength: 'weak' | 'moderate' | 'strong'
  template_text: string
  pattern_metadata: {
    antecedent: string[]
    consequent: string[]
    support: number
    confidence: number
    lift: number
    span_days: number
    occurrence_count: number
    natural_interval_days: number
    is_escalating: boolean
    anchor_entry_ids: string[]
  }
}

interface SemanticCluster {
  id: string
  centroid: number[]
  member_ids: string[]
  member_embeddings: number[][]
  label: string
  valence_sum: number
  timestamps: Date[]
}

interface AssociationRule {
  antecedent: string[]
  consequent: string[]
  support: number
  confidence: number
  lift: number
  entry_ids: string[]
  span_days: number
  occurrence_count: number
  natural_interval_days: number
  is_escalating: boolean
  template_text: string
  anchor_entry_ids: string[]
}

export interface WgarmResult {
  error?: string
  mirror_candidates: WgarmMirrorCandidate[]
  stats: {
    entries: number
    clusters: number
    frequent_itemsets: number
    rules: number
  }
}

const VALENCE_ITEMS = new Set(['valence:negativ', 'valence:positiv', 'valence:neutral'])

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    na += a[i]! * a[i]!
    nb += b[i]! * b[i]!
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]]
  if (items.length < size) return []
  const [head, ...rest] = items
  const withHead = combinations(rest, size - 1).map(c => [head!, ...c])
  const withoutHead = combinations(rest, size)
  return [...withHead, ...withoutHead]
}

function buildSemanticClusters(
  entries: WgarmEntry[],
  threshold = 0.73,
): { clusters: SemanticCluster[]; entryToCluster: Map<string, string> } {
  const clusters: SemanticCluster[] = []
  const entryToCluster = new Map<string, string>()
  const sorted = [...entries].sort((a, b) => a.created_at.getTime() - b.created_at.getTime())

  for (const entry of sorted) {
    if (!entry.embedding?.length) continue
    const emb = entry.embedding

    let bestCluster: SemanticCluster | null = null
    let bestSim = threshold

    for (const cluster of clusters) {
      const sim = cosineSimilarity(emb, cluster.centroid)
      if (sim > bestSim) {
        bestSim = sim
        bestCluster = cluster
      }
    }

    if (!bestCluster) {
      bestCluster = {
        id: `C${clusters.length + 1}`,
        centroid: [...emb],
        member_ids: [],
        member_embeddings: [],
        label: '',
        valence_sum: 0,
        timestamps: [],
      }
      clusters.push(bestCluster)
    }

    const n = bestCluster.member_ids.length
    bestCluster.centroid = bestCluster.centroid.map((v, i) => (v * n + emb[i]!) / (n + 1))
    bestCluster.member_ids.push(entry.id)
    bestCluster.member_embeddings.push(emb)
    bestCluster.valence_sum += entry.grid_x
    bestCluster.timestamps.push(entry.created_at)
    entryToCluster.set(entry.id, bestCluster.id)
  }

  labelClusters(clusters, entries)
  return { clusters, entryToCluster }
}

function labelClusters(clusters: SemanticCluster[], entries: WgarmEntry[]): void {
  const byId = new Map(entries.map(e => [e.id, e]))
  for (const c of clusters) {
    const counts = new Map<string, number>()
    for (const id of c.member_ids) {
      for (const tag of byId.get(id)?.mood_tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t)
    c.label = top.length ? top.join(' + ') : `Cluster ${c.id}`
  }
}

function anchorEntryIds(cluster: SemanticCluster, n = 2): string[] {
  if (cluster.member_ids.length <= n) return [...cluster.member_ids]
  const scores: [number, string][] = cluster.member_embeddings.map((emb, i) => {
    const sims = cluster.member_embeddings
      .filter((_, j) => j !== i)
      .map(other => cosineSimilarity(emb, other))
    const avg = sims.length ? sims.reduce((a, b) => a + b, 0) / sims.length : 0
    return [avg, cluster.member_ids[i]!]
  })
  scores.sort((a, b) => b[0] - a[0])
  return scores.slice(0, n).map(([, id]) => id)
}

function entryToTransaction(entry: WgarmEntry, clusterId?: string): string[] {
  const items: string[] = []
  if (clusterId) items.push(`cluster:${clusterId}`)

  if (entry.grid_x < -0.3) items.push('valence:negativ')
  else if (entry.grid_x > 0.3) items.push('valence:positiv')
  else items.push('valence:neutral')

  for (const tag of entry.mood_tags) items.push(`tag:${tag.toLowerCase()}`)

  const h = entry.hour_of_day
  if (h < 6) items.push('time:nacht')
  else if (h < 12) items.push('time:morgen')
  else if (h < 17) items.push('time:mittag')
  else if (h < 22) items.push('time:abend')
  else items.push('time:spaet')

  items.push(entry.day_of_week >= 5 ? 'weekday:weekend' : 'weekday:woche')
  return items
}

function findFrequentItemsets(
  transactions: string[][],
  minSupport = 0.15,
  maxItemsetSize = 3,
): Map<string, number> {
  const n = transactions.length
  const minCount = Math.max(2, Math.floor(minSupport * n))
  const tSets = transactions.map(t => new Set(t))

  const itemCounts = new Map<string, number>()
  for (const t of tSets) for (const item of t) itemCounts.set(item, (itemCounts.get(item) ?? 0) + 1)
  const frequentItems = [...itemCounts.entries()].filter(([, c]) => c >= minCount).map(([i]) => i)

  const frequent = new Map<string, number>()
  for (let size = 1; size <= maxItemsetSize; size++) {
    for (const combo of combinations(frequentItems.sort(), size)) {
      const key = combo.join('\0')
      const count = tSets.filter(t => combo.every(i => t.has(i))).length
      if (count >= minCount) frequent.set(key, count / n)
    }
  }
  return frequent
}

function parseItemset(key: string): string[] {
  return key.split('\0')
}

function generateRules(
  frequent: Map<string, number>,
  minConfidence = 0.60,
  minLift = 1.30,
): Array<{ antecedent: string[]; consequent: string[]; support: number; confidence: number; lift: number }> {
  const rules: Array<{ antecedent: string[]; consequent: string[]; support: number; confidence: number; lift: number }> = []

  for (const [key, sup] of frequent) {
    const itemset = parseItemset(key)
    if (itemset.length < 2) continue

    for (const valenceItem of VALENCE_ITEMS) {
      if (!itemset.includes(valenceItem)) continue
      const antecedent = itemset.filter(i => i !== valenceItem).sort()
      if (!antecedent.length) continue

      const antKey = antecedent.join('\0')
      const antSup = frequent.get(antKey)
      if (!antSup) continue

      const consSup = frequent.get(valenceItem) ?? 0
      const confidence = sup / antSup
      const lift = consSup > 0 ? confidence / consSup : 0

      if (confidence >= minConfidence && lift >= minLift) {
        rules.push({
          antecedent,
          consequent: [valenceItem],
          support: Math.round(sup * 1000) / 1000,
          confidence: Math.round(confidence * 1000) / 1000,
          lift: Math.round(lift * 100) / 100,
        })
      }
    }
  }

  return rules.sort((a, b) => b.lift - a.lift)
}

function annotateRule(
  rule: { antecedent: string[]; consequent: string[]; support: number; confidence: number; lift: number },
  entries: WgarmEntry[],
  entryToCluster: Map<string, string>,
  clusters: SemanticCluster[],
): AssociationRule {
  const antSet = new Set(rule.antecedent)
  const matching = entries.filter(e => {
    const cid = entryToCluster.get(e.id)
    const t = new Set(entryToTransaction(e, cid))
    for (const a of antSet) if (!t.has(a)) return false
    return true
  })

  const dates = matching.map(e => e.created_at).sort((a, b) => a.getTime() - b.getTime())
  const intervals: number[] = []
  for (let i = 1; i < dates.length; i++) {
    intervals.push((dates[i]!.getTime() - dates[i - 1]!.getTime()) / 86400000)
  }

  const spanDays = dates.length > 1
    ? Math.round((dates[dates.length - 1]!.getTime() - dates[0]!.getTime()) / 86400000)
    : 0
  const naturalInterval = intervals.length
    ? Math.round((intervals.reduce((a, b) => a + b, 0) / intervals.length) * 10) / 10
    : 0

  let isEscalating = false
  if (intervals.length >= 3) {
    const mid = Math.floor(intervals.length / 2)
    const firstAvg = intervals.slice(0, mid).reduce((a, b) => a + b, 0) / mid
    const secondAvg = intervals.slice(mid).reduce((a, b) => a + b, 0) / (intervals.length - mid)
    isEscalating = secondAvg < firstAvg * 0.7
  }

  const clusterIdsInAnt = rule.antecedent.filter(i => i.startsWith('cluster:')).map(i => i.split(':')[1]!)
  let anchorIds: string[] = []
  for (const cid of clusterIdsInAnt) {
    const cluster = clusters.find(c => c.id === cid)
    if (cluster) anchorIds = anchorEntryIds(cluster, 2)
  }
  if (!anchorIds.length && matching.length) {
    anchorIds = matching.length > 1
      ? [matching[0]!.id, matching[matching.length - 1]!.id]
      : [matching[0]!.id]
  }

  return {
    ...rule,
    entry_ids: matching.map(e => e.id),
    span_days: spanDays,
    occurrence_count: matching.length,
    natural_interval_days: naturalInterval,
    is_escalating: isEscalating,
    template_text: '',
    anchor_entry_ids: anchorIds,
  }
}

function signalStrength(rule: AssociationRule): 'weak' | 'moderate' | 'strong' {
  if (rule.confidence > 0.80 && rule.lift > 2.0 && rule.occurrence_count >= 5) return 'strong'
  if (rule.confidence > 0.65 && rule.lift > 1.5 && rule.occurrence_count >= 3) return 'moderate'
  return 'weak'
}

function generateText(rule: AssociationRule, clusters: SemanticCluster[]): string {
  const ant = rule.antecedent
  const cons = rule.consequent[0] ?? ''
  const confPct = Math.round(rule.confidence * 100)
  const weeks = Math.round(rule.span_days / 7 * 10) / 10
  const count = rule.occurrence_count
  const escalationNote = rule.is_escalating ? ' Die Häufigkeit nimmt zu.' : ''

  let label = ''
  for (const item of ant) {
    if (item.startsWith('cluster:')) {
      const cid = item.split(':')[1]
      label = clusters.find(c => c.id === cid)?.label ?? ''
      break
    }
  }

  const persons = ant.filter(i => i.startsWith('tag:')).map(i => i.split(':')[1]!.charAt(0).toUpperCase() + i.split(':')[1]!.slice(1))
  const timeItems = ant.filter(i => i.startsWith('time:')).map(i => i.split(':')[1]!)
  const weekdayItems = ant.filter(i => i.startsWith('weekday:')).map(i => i.split(':')[1]!)

  if (label && cons === 'valence:negativ') {
    return `Das Thema "${label}" taucht seit ${weeks} Wochen regelmäßig auf — ${count}× beschrieben.${escalationNote}`
  }
  if (label && cons === 'valence:positiv') {
    return `"${label}" erscheint als wiederkehrende positive Kraft — ${count}× in ${weeks} Wochen.`
  }
  if (persons.length && cons === 'valence:negativ') {
    return `Wenn du mit ${persons.join(', ')} zusammen bist, fühlst du dich in ${confPct}% der Fälle unwohl.`
  }
  if (persons.length && cons === 'valence:positiv') {
    return `Einträge mit ${persons.join(', ')} sind in ${confPct}% der Fälle positiv.`
  }
  if (timeItems.length && cons === 'valence:negativ') {
    return `Deine ${timeItems[0]}-Einträge zeigen systematisch negativere Zustände als zu anderen Tageszeiten.`
  }
  if (weekdayItems.length && cons === 'valence:negativ') {
    const w = weekdayItems[0] === 'weekend' ? 'am Wochenende' : 'unter der Woche'
    return `Du notierst ${w} häufiger negative Zustände (${confPct}% der Fälle).`
  }

  const antStr = ant.filter(a => !a.startsWith('cluster:')).join(', ')
  const valenceStr = cons === 'valence:negativ' ? 'negativen' : 'positiven'
  return `Mir ist aufgefallen: ${antStr} hängt in ${confPct}% der Fälle mit ${valenceStr} Zuständen zusammen.`
}

function dedupeRules(rules: AssociationRule[]): AssociationRule[] {
  const seen = new Map<string, AssociationRule>()
  for (const r of rules) {
    const key = `${r.consequent.join()}::${r.template_text}`
    if (!seen.has(key)) seen.set(key, r)
  }
  return [...seen.values()]
}

export function runWgarmEc(
  entries: WgarmEntry[],
  opts: { clusterThreshold?: number; minSupport?: number; minConfidence?: number; minLift?: number } = {},
): WgarmResult {
  const {
    clusterThreshold = 0.73,
    minSupport = 0.15,
    minConfidence = 0.60,
    minLift = 1.30,
  } = opts

  if (entries.length < 10) {
    return {
      error: 'Zu wenig Einträge (min. 10 erforderlich)',
      mirror_candidates: [],
      stats: { entries: entries.length, clusters: 0, frequent_itemsets: 0, rules: 0 },
    }
  }

  const hasEmb = entries.some(e => e.embedding?.length)
  const { clusters, entryToCluster } = hasEmb
    ? buildSemanticClusters(entries, clusterThreshold)
    : { clusters: [] as SemanticCluster[], entryToCluster: new Map<string, string>() }

  const transactions = entries.map(e => entryToTransaction(e, entryToCluster.get(e.id)))
  const frequent = findFrequentItemsets(transactions, minSupport)
  const rawRules = generateRules(frequent, minConfidence, minLift)

  let rules = rawRules.map(r => {
    const ar = annotateRule(r, entries, entryToCluster, clusters)
    ar.template_text = generateText(ar, clusters)
    return ar
  })

  rules = dedupeRules(rules)

  const mirror_candidates: WgarmMirrorCandidate[] = rules.map(r => ({
    entry_ids: r.entry_ids,
    source: 'wgarm_ec',
    signal_strength: signalStrength(r),
    template_text: r.template_text,
    pattern_metadata: {
      antecedent: r.antecedent,
      consequent: r.consequent,
      support: r.support,
      confidence: r.confidence,
      lift: r.lift,
      span_days: r.span_days,
      occurrence_count: r.occurrence_count,
      natural_interval_days: r.natural_interval_days,
      is_escalating: r.is_escalating,
      anchor_entry_ids: r.anchor_entry_ids,
    },
  }))

  return {
    mirror_candidates,
    stats: {
      entries: entries.length,
      clusters: clusters.length,
      frequent_itemsets: frequent.size,
      rules: rules.length,
    },
  }
}

export function parseEmbedding(raw: number[] | string | null | undefined): number[] | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as number[]
    } catch {
      return null
    }
  }
  return null
}

export function toWgarmEntry(e: {
  id: string
  created_at: string
  grid_x: number | null
  grid_y: number | null
  person: string | null
  location: string | null
  activity: string | null
  body_state: string | null
  text: string
  embedding?: number[] | string | null
}): WgarmEntry | null {
  const embedding = parseEmbedding(e.embedding ?? null)
  if (!embedding?.length) return null

  const dt = new Date(e.created_at)
  const tags = [e.person, e.location, e.activity, e.body_state].filter(Boolean) as string[]

  return {
    id: e.id,
    created_at: dt,
    grid_x: (e.grid_x ?? 0) / 5,
    grid_y: (e.grid_y ?? 0) / 5,
    mood_tags: tags,
    hour_of_day: dt.getHours(),
    day_of_week: dt.getDay() === 0 ? 6 : dt.getDay() - 1,
    text: e.text,
    embedding,
  }
}

const STRENGTH_RANK = { strong: 3, moderate: 2, weak: 1 } as const

export function pickBestWgarmCandidate(candidates: WgarmMirrorCandidate[]): WgarmMirrorCandidate | null {
  if (!candidates.length) return null
  return [...candidates].sort((a, b) => {
    const sd = STRENGTH_RANK[b.signal_strength] - STRENGTH_RANK[a.signal_strength]
    if (sd !== 0) return sd
    return b.pattern_metadata.lift - a.pattern_metadata.lift
  })[0]!
}
