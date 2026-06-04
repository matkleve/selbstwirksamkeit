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
    makeEntry({ person: 'Mama', daysAgo: 1 }),
    makeEntry({ person: 'Mama', daysAgo: 2 }),
    makeEntry({ person: 'Papa', daysAgo: 3 }),
  ]
  assert(detectTagFrequency(entries) === null, 'erwartete null')
})

test('gibt Kandidaten zurück wenn Tag 3× in History vorkommt', () => {
  const entries = [
    makeEntry({ person: 'Mama', daysAgo: 1 }),
    makeEntry({ person: 'Mama', daysAgo: 2 }),
    makeEntry({ person: 'Mama', daysAgo: 3 }),
  ]
  const r = detectTagFrequency(entries)
  assert(r !== null, 'erwartete Kandidaten, bekam null')
  assert(r!.source === 'tag_frequency', `source falsch: ${r!.source}`)
  assert(r!.count === 3, `count falsch: ${r!.count}`)
  assert(r!.introText.includes('Mama'), `introText enthält nicht "Mama": ${r!.introText}`)
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
  assert(r!.introText.includes('seit'), `introText soll Zeitspanne nennen: ${r!.introText}`)
  assert(!r!.introText.includes('7 Tagen'), `kein 7-Tage-Text: ${r!.introText}`)
})

test('introText beschreibt Intervall statt Wochenzählung', () => {
  const entries = Array.from({ length: 8 }, (_, i) =>
    makeEntry({ body_state: 'tired', daysAgo: (7 - i) * 5 }),
  )
  const r = detectTagFrequency(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('~5 Tage'), `Intervall fehlt: ${r!.introText}`)
  assert(r!.introText.includes('8×'), `count fehlt: ${r!.introText}`)
})

test('wählt den häufigsten Tag wenn mehrere konkurrieren', () => {
  const entries = [
    makeEntry({ person: 'Mama', daysAgo: 1 }),
    makeEntry({ person: 'Mama', daysAgo: 2 }),
    makeEntry({ person: 'Mama', daysAgo: 3 }),
    makeEntry({ location: 'Büro', daysAgo: 1 }),
    makeEntry({ location: 'Büro', daysAgo: 2 }),
    makeEntry({ location: 'Büro', daysAgo: 3 }),
    makeEntry({ location: 'Büro', daysAgo: 4 }),
  ]
  const r = detectTagFrequency(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('Büro'), `sollte Büro wählen (4×), bekam: ${r!.introText}`)
})

test('signal_strength ist "strong" ab 5 Einträgen', () => {
  const entries = Array.from({ length: 5 }, (_, i) => makeEntry({ person: 'Mama', daysAgo: (i + 1) * 7 }))
  const r = detectTagFrequency(entries)
  assert(r?.signalStrength === 'strong', `erwartete strong, bekam: ${r?.signalStrength}`)
})

test('signal_strength ist "moderate" bei 3–4 Einträgen', () => {
  const entries = [
    makeEntry({ person: 'Mama', daysAgo: 7 }),
    makeEntry({ person: 'Mama', daysAgo: 14 }),
    makeEntry({ person: 'Mama', daysAgo: 21 }),
  ]
  const r = detectTagFrequency(entries)
  assert(r?.signalStrength === 'moderate', `erwartete moderate, bekam: ${r?.signalStrength}`)
})

test('zeigt maximal 3 Einträge auch wenn mehr vorhanden', () => {
  const entries = Array.from({ length: 6 }, (_, i) => makeEntry({ person: 'Mama', daysAgo: (i + 1) * 10 }))
  const r = detectTagFrequency(entries)
  assert(r!.entries.length === 3, `erwartet 3, bekam: ${r!.entries.length}`)
  assert(r!.count === 6, `count soll trotzdem 6 sein, bekam: ${r!.count}`)
})

test('funktioniert auch mit body_state statt person', () => {
  const entries = [
    makeEntry({ body_state: 'tired', daysAgo: 10 }),
    makeEntry({ body_state: 'tired', daysAgo: 20 }),
    makeEntry({ body_state: 'tired', daysAgo: 30 }),
  ]
  const r = detectTagFrequency(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('tired'), `introText fehlt body_state: ${r!.introText}`)
})

test('gibt null zurück bei leerer Liste', () => {
  assert(detectTagFrequency([]) === null, 'erwartete null für leere Liste')
})

console.log('\n── detectGridCluster ──')

test('gibt null zurück wenn keine 3 Einträge im selben Quadranten', () => {
  const entries = [
    makeEntry({ grid_x: 2, grid_y: 1, daysAgo: 1 }),
    makeEntry({ grid_x: 2, grid_y: 1, daysAgo: 2 }),
    makeEntry({ grid_x: -2, grid_y: 1, daysAgo: 3 }),
  ]
  assert(detectGridCluster(entries) === null, 'erwartete null')
})

test('findet nx_ny Quadrant (schwer, selbstbezogen)', () => {
  const entries = [
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 10 }),
    makeEntry({ grid_x: -3, grid_y: -2, daysAgo: 20 }),
    makeEntry({ grid_x: -1, grid_y: -3, daysAgo: 30 }),
  ]
  const r = detectGridCluster(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('schwer, auf dich bezogen'), `falsches Label: ${r!.introText}`)
  assert(r!.introText.includes('seit'), `Zeitspanne fehlt: ${r!.introText}`)
})

test('ignoriert Einträge ohne grid_x oder grid_y', () => {
  const entries = [
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 1 }),
    makeEntry({ grid_x: -3, grid_y: -2, daysAgo: 2 }),
    makeEntry({ grid_x: null, grid_y: null, daysAgo: 3 }),
    makeEntry({ grid_x: null, grid_y: null, daysAgo: 4 }),
  ]
  assert(detectGridCluster(entries) === null, 'sollte null sein, nur 2 gültige nx_ny Einträge')
})

test('zählt Grid-Cluster über gesamte History', () => {
  const entries = [
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 1 }),
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 15 }),
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 45 }),
  ]
  const r = detectGridCluster(entries)
  assert(r !== null, 'sollte 3 Einträge über 45 Tage finden')
  assert(r!.count === 3, `count: ${r!.count}`)
  assert(!r!.introText.includes('7 Tagen'), `kein 7-Tage-Text: ${r!.introText}`)
})

test('wählt Quadrant mit meisten Einträgen', () => {
  const entries = [
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 10 }),
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 20 }),
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 30 }),
    makeEntry({ grid_x: 2, grid_y: 1, daysAgo: 10 }),
    makeEntry({ grid_x: 2, grid_y: 1, daysAgo: 20 }),
  ]
  const r = detectGridCluster(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('schwer, auf dich bezogen'), `sollte nx_ny wählen: ${r!.introText}`)
})

console.log(`\n${'─'.repeat(40)}`)
console.log(`Ergebnis: ${passed} bestanden · ${failed} fehlgeschlagen\n`)
if (failed > 0) process.exit(1)
