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

// ─────────────────────────────────────────
console.log('\n── detectTagFrequency ──')

test('gibt null zurück wenn kein Tag 3× vorkommt', () => {
  const entries = [
    makeEntry({ person: 'Mama', daysAgo: 1 }),
    makeEntry({ person: 'Mama', daysAgo: 2 }),
    makeEntry({ person: 'Papa', daysAgo: 3 }),
  ]
  assert(detectTagFrequency(entries) === null, 'erwartete null')
})

test('gibt Kandidaten zurück wenn Tag 3× in 7 Tagen vorkommt', () => {
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

test('ignoriert Einträge älter als 7 Tage', () => {
  const entries = [
    makeEntry({ person: 'Mama', daysAgo: 1 }),
    makeEntry({ person: 'Mama', daysAgo: 2 }),
    makeEntry({ person: 'Mama', daysAgo: 8 }),  // zu alt
  ]
  assert(detectTagFrequency(entries) === null, 'sollte null sein — 3. Eintrag ist >7 Tage alt')
})

test('wählt den häufigsten Tag wenn mehrere konkurrieren', () => {
  const entries = [
    makeEntry({ person: 'Mama', daysAgo: 1 }),
    makeEntry({ person: 'Mama', daysAgo: 2 }),
    makeEntry({ person: 'Mama', daysAgo: 3 }),
    makeEntry({ location: 'Büro', daysAgo: 1 }),
    makeEntry({ location: 'Büro', daysAgo: 2 }),
    makeEntry({ location: 'Büro', daysAgo: 3 }),
    makeEntry({ location: 'Büro', daysAgo: 4 }),  // Büro 4×, Mama 3×
  ]
  const r = detectTagFrequency(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('Büro'), `sollte Büro wählen (4×), bekam: ${r!.introText}`)
})

test('signal_strength ist "strong" ab 5 Einträgen', () => {
  const entries = Array.from({ length: 5 }, (_, i) => makeEntry({ person: 'Mama', daysAgo: i + 1 }))
  const r = detectTagFrequency(entries)
  assert(r?.signalStrength === 'strong', `erwartete strong, bekam: ${r?.signalStrength}`)
})

test('signal_strength ist "moderate" bei 3–4 Einträgen', () => {
  const entries = [
    makeEntry({ person: 'Mama', daysAgo: 1 }),
    makeEntry({ person: 'Mama', daysAgo: 2 }),
    makeEntry({ person: 'Mama', daysAgo: 3 }),
  ]
  const r = detectTagFrequency(entries)
  assert(r?.signalStrength === 'moderate', `erwartete moderate, bekam: ${r?.signalStrength}`)
})

test('zeigt maximal 3 Einträge auch wenn mehr vorhanden', () => {
  const entries = Array.from({ length: 6 }, (_, i) => makeEntry({ person: 'Mama', daysAgo: i + 1 }))
  const r = detectTagFrequency(entries)
  assert(r!.entries.length === 3, `erwartet 3, bekam: ${r!.entries.length}`)
  assert(r!.count === 6, `count soll trotzdem 6 sein, bekam: ${r!.count}`)
})

test('funktioniert auch mit body_state statt person', () => {
  const entries = [
    makeEntry({ body_state: 'tired', daysAgo: 1 }),
    makeEntry({ body_state: 'tired', daysAgo: 2 }),
    makeEntry({ body_state: 'tired', daysAgo: 3 }),
  ]
  const r = detectTagFrequency(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('tired'), `introText fehlt body_state: ${r!.introText}`)
})

test('gibt null zurück bei leerer Liste', () => {
  assert(detectTagFrequency([]) === null, 'erwartete null für leere Liste')
})

// ─────────────────────────────────────────
console.log('\n── detectGridCluster ──')

test('gibt null zurück wenn keine 3 Einträge im selben Quadranten', () => {
  const entries = [
    makeEntry({ grid_x: 2, grid_y: 1, daysAgo: 1 }),   // px_py
    makeEntry({ grid_x: 2, grid_y: 1, daysAgo: 2 }),   // px_py
    makeEntry({ grid_x: -2, grid_y: 1, daysAgo: 3 }),  // nx_py
  ]
  assert(detectGridCluster(entries) === null, 'erwartete null')
})

test('findet nx_ny Quadrant (schwer, selbstbezogen)', () => {
  const entries = [
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 1 }),
    makeEntry({ grid_x: -3, grid_y: -2, daysAgo: 2 }),
    makeEntry({ grid_x: -1, grid_y: -3, daysAgo: 3 }),
  ]
  const r = detectGridCluster(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('schwer, auf dich bezogen'), `falsches Label: ${r!.introText}`)
})

test('ignoriert Einträge ohne grid_x oder grid_y', () => {
  const entries = [
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 1 }),
    makeEntry({ grid_x: -3, grid_y: -2, daysAgo: 2 }),
    makeEntry({ grid_x: null, grid_y: null, daysAgo: 3 }),  // kein Grid
    makeEntry({ grid_x: null, grid_y: null, daysAgo: 4 }),
  ]
  assert(detectGridCluster(entries) === null, 'sollte null sein, nur 2 gültige nx_ny Einträge')
})

test('ignoriert Einträge älter als 7 Tage', () => {
  const entries = [
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 1 }),
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 2 }),
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 9 }),  // zu alt
  ]
  assert(detectGridCluster(entries) === null, 'sollte null sein — 3. zu alt')
})

test('wählt Quadrant mit meisten Einträgen', () => {
  const entries = [
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 1 }),  // nx_ny x3
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 2 }),
    makeEntry({ grid_x: -2, grid_y: -1, daysAgo: 3 }),
    makeEntry({ grid_x: 2,  grid_y: 1,  daysAgo: 1 }),  // px_py x2
    makeEntry({ grid_x: 2,  grid_y: 1,  daysAgo: 2 }),
  ]
  const r = detectGridCluster(entries)
  assert(r !== null, 'erwartete Kandidaten')
  assert(r!.introText.includes('schwer, auf dich bezogen'), `sollte nx_ny wählen: ${r!.introText}`)
})

// ─────────────────────────────────────────
console.log('\n── Bekannte Bugs ──')

test('BUG: mirror_candidates Tabelle hat keine intro_text / question Spalte', () => {
  // page.tsx Zeile 49-50:
  //   introText: stored.intro_text ?? '',
  //   question:  stored.question  ?? '',
  // Diese Spalten existieren nicht in 007_mirror_candidates.sql.
  // Wenn ein Kandidat aus der DB geladen wird, sind introText und question immer ''.
  // Mirror zeigt dann leeren Intro-Text und leere Frage.
  const missingColumns = ['intro_text', 'question']
  console.log(`     Fehlende Spalten in mirror_candidates: ${missingColumns.join(', ')}`)
  assert(true, '') // nur dokumentieren
})

// ─────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`)
console.log(`Ergebnis: ${passed} bestanden · ${failed} fehlgeschlagen\n`)
if (failed > 0) process.exit(1)
