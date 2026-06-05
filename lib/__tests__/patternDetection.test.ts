// Standalone test — run with: npx tsx lib/__tests__/patternDetection.test.ts
import { detectTagFrequency, detectGridCluster } from '../patternDetection'
import type { Entry } from '../types'

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  ✓  ${name}`)
    passed++
  } catch (e: unknown) {
    console.error(`  ✗  ${name}`)
    console.error(`     ${(e as Error).message}`)
    failed++
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg)
}

function makeEntry(overrides: Partial<Entry> & { daysAgo?: number }): Entry {
  const { daysAgo = 0, ...rest } = overrides
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  return {
    id: Math.random().toString(36).slice(2),
    user_id: 'user-1',
    title: null,
    text: 'Testeintrag',
    grid_x: null,
    grid_y: null,
    reframe: null,
    person: null,
    location: null,
    activity: null,
    body_state: null,
    created_at: d.toISOString(),
    ...rest,
  }
}

console.log('\n── detectTagFrequency ──')

test('gibt null zurück wenn kein Tag 3× vorkommt', () => {
  const entries = [
    makeEntry({ person: 'Mama', daysAgo: 20 }),
    makeEntry({ person: 'Mama', daysAgo: 25 }),
    makeEntry({ person: 'Papa', daysAgo: 30 }),
  ]
  assert(detectTagFrequency(entries) === null, 'erwartete null')
})

test('gibt Kandidaten zurück wenn Tag 3× über ≥14 Tage', () => {
  const entries = [
    makeEntry({ person: 'Mama', daysAgo: 30 }),
    makeEntry({ person: 'Mama', daysAgo: 20 }),
    makeEntry({ person: 'Mama', daysAgo: 10 }),
  ]
  const r = detectTagFrequency(entries)
  assert(r !== null, 'erwartete Kandidaten, bekam null')
  assert(r!.source === 'tag_frequency', `source falsch: ${r!.source}`)
  assert(r!.count === 3, `count falsch: ${r!.count}`)
  assert(!!(r!.introText.includes('Mama') || r!.summaryText), 'intro oder summary fehlt')
})

test('zählt Einträge über gesamte History — auch älter als 7 Tage', () => {
  const entries = [
    makeEntry({ person: 'Mama', daysAgo: 1 }),
    makeEntry({ person: 'Mama', daysAgo: 10 }),
    makeEntry({ person: 'Mama', daysAgo: 20 }),
    makeEntry({ person: 'Mama', daysAgo: 30 }),
  ]
  const r = detectTagFrequency(entries)
  assert(r !== null, 'sollte Kandidaten finden — 4× über 30 Tage')
  assert(r!.count === 4, `count soll 4 sein, bekam: ${r!.count}`)
  assert(!!r!.summaryText?.includes('4×'), `summary fehlt count: ${r!.summaryText}`)
})

test('neutral template bei fehlender Valence', () => {
  const entries = Array.from({ length: 8 }, (_, i) =>
    makeEntry({ body_state: 'tired', daysAgo: 15 + i * 5 }),
  )
  const r = detectTagFrequency(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('müde'), `label fehlt: ${r!.introText}`)
  assert(r!.introText.includes('~'), `intervall fehlt: ${r!.introText}`)
})

test('positiv template mit summaryText', () => {
  const entries = Array.from({ length: 5 }, (_, i) =>
    makeEntry({ person: 'Mama', grid_x: 3, daysAgo: 15 + i * 5 }),
  )
  const r = detectTagFrequency(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(!!r!.summaryText?.includes('5×'), `summary: ${r!.summaryText}`)
  assert(r!.introText.includes('Mama'), `tag fehlt: ${r!.introText}`)
  assert(r!.introText.includes('positiv'), `valence fehlt: ${r!.introText}`)
})

test('negativ template nennt Tag und Valence', () => {
  const entries = Array.from({ length: 5 }, (_, i) =>
    makeEntry({ location: 'Bibliothek', grid_x: -3, daysAgo: 15 + i * 30 }),
  )
  const r = detectTagFrequency(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('Bibliothek'), `ort fehlt: ${r!.introText}`)
  assert(r!.introText.includes('schwer'), `valence fehlt: ${r!.introText}`)
})

test('wählt den häufigsten Tag wenn mehrere konkurrieren', () => {
  const entries = [
    ...Array.from({ length: 3 }, (_, i) => makeEntry({ person: 'Mama', daysAgo: 15 + i * 5 })),
    ...Array.from({ length: 4 }, (_, i) => makeEntry({ location: 'Büro', daysAgo: 15 + i * 5 })),
  ]
  const r = detectTagFrequency(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('Büro'), `sollte Büro wählen: ${r!.introText}`)
})

test('signal_strength ist "strong" ab 5 Einträgen', () => {
  const entries = Array.from({ length: 5 }, (_, i) =>
    makeEntry({ person: 'Mama', daysAgo: 15 + (i + 1) * 7 }),
  )
  const r = detectTagFrequency(entries)
  assert(r?.signalStrength === 'strong', `erwartete strong, bekam: ${r?.signalStrength}`)
})

test('signal_strength ist "moderate" bei 3–4 Einträgen', () => {
  const entries = [
    makeEntry({ person: 'Mama', daysAgo: 15 }),
    makeEntry({ person: 'Mama', daysAgo: 22 }),
    makeEntry({ person: 'Mama', daysAgo: 29 }),
  ]
  const r = detectTagFrequency(entries)
  assert(r?.signalStrength === 'moderate', `erwartete moderate, bekam: ${r?.signalStrength}`)
})

test('zeigt maximal 3 Einträge auch wenn mehr vorhanden', () => {
  const entries = Array.from({ length: 6 }, (_, i) =>
    makeEntry({ person: 'Mama', daysAgo: 15 + (i + 1) * 10 }),
  )
  const r = detectTagFrequency(entries)
  assert(r!.entries.length === 3, `erwartet 3, bekam: ${r!.entries.length}`)
  assert(r!.count === 6, `count soll trotzdem 6 sein, bekam: ${r!.count}`)
})

test('gibt null zurück bei leerer Liste', () => {
  assert(detectTagFrequency([]) === null, 'erwartete null für leere Liste')
})

test('zählt atomare Personen in komma-getrennten Werten', () => {
  const entries = [
    makeEntry({ person: 'Tom, Anna', daysAgo: 30 }),
    makeEntry({ person: 'Tom', daysAgo: 20 }),
    makeEntry({ person: 'Anna, Tom', daysAgo: 10 }),
  ]
  const r = detectTagFrequency(entries)
  assert(r !== null, 'Tom sollte 3× in History vorkommen')
  assert(r!.introText.includes('Tom') || r!.summaryText?.includes('Tom'), `Tom fehlt: ${r!.introText}`)
  assert(r!.count === 3, `count soll 3 sein (alle Einträge mit Tom), bekam: ${r!.count}`)
})

test('zählt atomare Orte in komma-getrennten Werten', () => {
  const entries = Array.from({ length: 4 }, (_, i) =>
    makeEntry({ location: 'Bibliothek, Café', daysAgo: 15 + i * 7 }),
  )
  const r = detectTagFrequency(entries)
  assert(r !== null, 'Bibliothek sollte 4× zählen')
  assert(r!.introText.includes('Bibliothek'), `Ort fehlt: ${r!.introText}`)
  assert(r!.count === 4, `count: ${r!.count}`)
})

test('relevantMeta enthält den atomaren Gewinner-Tag', () => {
  const entries = [
    ...Array.from({ length: 4 }, (_, i) => makeEntry({ person: 'Tom, Anna', daysAgo: 15 + i * 7 })),
    makeEntry({ person: 'Anna', daysAgo: 12 }),
  ]
  const r = detectTagFrequency(entries)
  assert(r !== null, 'erwartete Kandidaten — Tom 4× vs Anna 5×')
  assert(r!.relevantMeta?.includes('Anna'), `Anna sollte Gewinner sein: ${r!.relevantMeta}`)
})

console.log('\n── detectGridCluster ──')

test('gibt null zurück wenn keine 5 Einträge im selben Quadranten', () => {
  const entries = [
    makeEntry({ grid_x: 2, grid_y: 1, daysAgo: 15 }),
    makeEntry({ grid_x: 2, grid_y: 1, daysAgo: 20 }),
    makeEntry({ grid_x: -2, grid_y: 1, daysAgo: 25 }),
  ]
  assert(detectGridCluster(entries) === null, 'erwartete null')
})

test('findet nx_ny Quadrant (schwer, selbstbezogen)', () => {
  const entries = Array.from({ length: 5 }, (_, i) =>
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 15 + i * 10 }),
  )
  const r = detectGridCluster(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('schwer und auf dich gerichtet'), `falsches Label: ${r!.introText}`)
  assert(!!r!.summaryText?.includes('5×'), `summary fehlt: ${r!.summaryText}`)
})

test('ignoriert Einträge ohne grid_x oder grid_y', () => {
  const entries = [
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 15 }),
    makeEntry({ grid_x: -3, grid_y: -2, daysAgo: 20 }),
    makeEntry({ grid_x: null, grid_y: null, daysAgo: 25 }),
    makeEntry({ grid_x: null, grid_y: null, daysAgo: 30 }),
  ]
  assert(detectGridCluster(entries) === null, 'sollte null sein, nur 2 gültige nx_ny Einträge')
})

test('zählt Grid-Cluster über gesamte History', () => {
  const entries = Array.from({ length: 5 }, (_, i) =>
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 15 + i * 10 }),
  )
  const r = detectGridCluster(entries)
  assert(r !== null, 'sollte 5 Einträge finden')
  assert(r!.count === 5, `count: ${r!.count}`)
})

test('wählt Quadrant mit meisten Einträgen', () => {
  const entries = [
    ...Array.from({ length: 5 }, (_, i) =>
      makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 15 + i * 10 }),
    ),
    makeEntry({ grid_x: 2, grid_y: 1, daysAgo: 15 }),
    makeEntry({ grid_x: 2, grid_y: 1, daysAgo: 20 }),
  ]
  const r = detectGridCluster(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('schwer und auf dich gerichtet'), `sollte nx_ny wählen: ${r!.introText}`)
})

console.log(`\n${'─'.repeat(40)}`)
console.log(`Ergebnis: ${passed} bestanden · ${failed} fehlgeschlagen\n`)
if (failed > 0) process.exit(1)
