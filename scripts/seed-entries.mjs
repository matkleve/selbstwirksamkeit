#!/usr/bin/env node
/**
 * Seed ~150 journal entries over the past year (varied density + patterns).
 *
 * Meta tags are drawn from coherent *scenarios* (text + person + place + activity
 * match) so Mirror / tag_frequency demos are narratively plausible — not random names
 * on unrelated stories.
 *
 * Usage:
 *   node scripts/seed-entries.mjs
 *   node scripts/seed-entries.mjs --email you@example.com
 *   node scripts/seed-entries.mjs --dry-run
 *   node scripts/seed-entries.mjs --clear --email you@example.com   # local only
 *
 * --clear  Deletes the user's entries (+ mirror_sessions, mirror_candidates,
 *          implementation_intentions) before insert. Only allowed against
 *          local Supabase (127.0.0.1 / localhost :54321).
 *
 * Env (optional): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Falls back to `supabase status -o env` when running locally.
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const TARGET_COUNT = 150
const BATCH = 50

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const clearFirst = args.includes('--clear')
const emailFlag = args.find((a, i) => a === '--email' && args[i + 1])
const email = emailFlag ? args[args.indexOf('--email') + 1] : null

/** Local dev only — refuse --clear against hosted/production URLs. */
function isLocalSupabaseUrl(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (host === '127.0.0.1' || host === 'localhost') return true
    if (host.endsWith('.local') && u.port === '54321') return true
    return false
  } catch {
    return false
  }
}

function loadDotEnv(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function loadSupabaseEnv() {
  const fromLocal = loadDotEnv(resolve(ROOT, '.env.local'))
  const fromDocker = loadDotEnv(resolve(ROOT, '.env.docker'))

  let url = process.env.SUPABASE_URL
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    const raw = execSync('supabase status -o env 2>/dev/null', { cwd: ROOT, encoding: 'utf8' })
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/)
      if (!m) continue
      const v = m[2].replace(/^"|"$/g, '')
      if (m[1] === 'API_URL') url = url || v
      if (m[1] === 'SERVICE_ROLE_KEY') key = key || v
    }
  } catch {
    /* not local */
  }

  if (!url) {
    url =
      fromLocal.NEXT_PUBLIC_SUPABASE_URL ||
      fromLocal.SUPABASE_URL ||
      fromDocker.NEXT_PUBLIC_SUPABASE_URL
    if (url?.includes('host.docker.internal')) url = 'http://127.0.0.1:54321'
  }
  if (!key) {
    key = fromLocal.SUPABASE_SERVICE_ROLE_KEY
  }

  if (!url || !key) {
    console.error(
      'Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (env or .env.local), or local `supabase start`.',
    )
    process.exit(1)
  }
  return { url, key }
}

/**
 * Each scenario: matching text + meta + typical grid valence.
 * weight = relative frequency in the random pool (higher = more filler).
 */
const SCENARIOS = [
  {
    id: 'library_study',
    weight: 3.2,
    texts: [
      'Lernblockade: drei Stunden in der Bibliothek gesessen, wenig geschafft.',
      'In der Bib versucht zu lesen — Kopf war voll mit anderen Dingen.',
      'Vor der Klausur in der Bibliothek gelernt, danach erschöpft.',
      'Gruppenarbeit in der Bibliothek: wir kamen kaum voran.',
    ],
    grid_x: [-4, -1.5],
    grid_y: [-3, 1],
    person: null,
    location: 'Bibliothek',
    activity: 'Lernen',
    body_state: ['tired', 'stressed'],
  },
  {
    id: 'library_tom',
    weight: 1.4,
    texts: [
      'Mit Tom in der Bibliothek gelernt — heute hing der Stoff, beide genervt.',
      'Lernsitzung mit Tom in der Bib: kurz Fortschritt, dann wieder Stocken.',
      'Tom und ich vor der Abgabe in der Bibliothek — Stress, aber wir blieben dran.',
      'Mit Tom den Stoff durchgegangen — hat bei der Präsentation geholfen.',
      'Nach der Präsentation mit Tom gefeiert — leichter als erwartet.',
    ],
    grid_x: [-2.5, 3],
    grid_y: [-2, 3],
    person: 'Tom',
    location: 'Bibliothek',
    activity: 'Lernen',
    body_state: ['stressed', 'tired', 'calm'],
  },
  {
    id: 'library_group',
    weight: 0.9,
    texts: [
      'Lerngruppe in der Bibliothek mit Tom und Anna — heute ging wenig voran.',
      'Mit Tom, Anna in der Bib gelernt — alle müde, aber wir blieben sitzen.',
      'Gruppenarbeit Bibliothek: Tom, Anna und ich vor der Klausur.',
    ],
    grid_x: [-3, 0.5],
    grid_y: [-1, 2],
    person: 'Tom, Anna',
    location: 'Bibliothek',
    activity: 'Lernen',
    body_state: ['tired', 'stressed'],
  },
  {
    id: 'office_meeting',
    weight: 2.0,
    texts: [
      'Teammeeting im Büro — Kompliment bekommen, kurz unsicher, dann stolz.',
      'Gespräch mit dem Team Lead lief schief; danach innerlich laut.',
      'Meeting im Büro gezogen, abends noch mit Arbeit im Kopf.',
      'Im Büro Deadline-Stress: konnte kaum abschalten.',
    ],
    grid_x: [-3.5, 2.5],
    grid_y: [0.5, 4],
    person: 'Team Lead',
    location: 'Büro',
    activity: 'Meeting',
    body_state: ['stressed', 'calm'],
  },
  {
    id: 'campus_presentation',
    weight: 1.2,
    texts: [
      'Präsentation auf dem Campus lief besser als erwartet — danach leicht und klar.',
      'Vor der Präsentation nervös auf dem Campus — danach erleichtert.',
    ],
    grid_x: [1.5, 4.5],
    grid_y: [1, 4],
    person: 'Team Lead',
    location: 'Campus',
    activity: 'Präsentation',
    body_state: ['calm'],
  },
  {
    id: 'supervision',
    weight: 1.3,
    texts: [
      'Gutes Feedback von der Betreuung — fühlt sich nach echter Entwicklung an.',
      'Mit Betreuerin Dr. Weber gesprochen — klarer Blick aufs nächste Ziel.',
      'Nach dem Gespräch mit Dr. Weber wieder etwas Luft.',
    ],
    grid_x: [1, 4],
    grid_y: [0, 3],
    person: 'Betreuerin Dr. Weber',
    location: 'Campus',
    activity: 'Meeting',
    body_state: ['calm'],
  },
  {
    id: 'home_roommate',
    weight: 1.5,
    texts: [
      'Konflikt mit Mitbewohner wegen Lärm — danach angespannt geblieben.',
      'Zuhause zu lange am Bildschirm — am nächsten Tag müde und gereizt.',
      'Abends zuhause kaum runtergekommen.',
    ],
    grid_x: [-4, -0.5],
    grid_y: [-4, -0.5],
    person: 'Mitbewohner',
    location: 'Zuhause',
    activity: null,
    body_state: ['stressed', 'tired'],
  },
  {
    id: 'home_mama',
    weight: 1.1,
    texts: [
      'Mit Mama telefoniert — danach ruhiger und sortierter.',
      'Zuhause gekocht mit Mama — guter Abend trotz stressiger Woche.',
      'Habe heute Nein gesagt — danach mit Mama drüber gesprochen, ohne Schuldgefühl.',
    ],
    grid_x: [0.5, 4],
    grid_y: [-1, 3],
    person: 'Mama',
    location: 'Zuhause',
    activity: 'Kochen',
    body_state: ['calm'],
  },
  {
    id: 'cafe_anna',
    weight: 1.2,
    texts: [
      'Mit Anna im Café — spontan gegessen, ohne schlechtes Gewissen danach.',
      'Anna im Café getroffen — Stimmung hob sich merklich.',
    ],
    grid_x: [1.5, 4],
    grid_y: [1, 4],
    person: 'Anna',
    location: 'Café Mitte',
    activity: null,
    body_state: ['calm'],
  },
  {
    id: 'park_sport',
    weight: 1.4,
    texts: [
      'Morgenspaziergang im Park — Kopf frei bekommen.',
      'Sport im Park — danach Energie statt Leere.',
      'Laufen im Park nach langem Sitzen — spürbar besser.',
    ],
    grid_x: [1, 4.5],
    grid_y: [-2, 2],
    person: null,
    location: 'Park',
    activity: 'Sport',
    body_state: ['calm'],
  },
  {
    id: 'bewerbung',
    weight: 1.0,
    texts: [
      'Bewerbung geschrieben — Fortschritt, aber Anspannung bleibt.',
      'Vergleiche mich mit anderen beim Bewerben — kurz alles fühlt sich kleiner an.',
      'Eine Bewerbung abgeschickt — kleiner Schritt, trotzdem stolz.',
    ],
    grid_x: [-2.5, 2.5],
    grid_y: [-3, 0],
    person: null,
    location: 'Zuhause',
    activity: 'Bewerbung',
    body_state: ['stressed', 'calm'],
  },
  {
    id: 'neutral_routine',
    weight: 2.8,
    texts: [
      'Routine-Tag: Vorlesung, Bibliothek, früh ins Bett.',
      'Einkaufen erledigt, Wohnung aufgeräumt — nichts Großes, aber okay.',
      'Viel unterwegs gewesen, abends müde aber zufrieden.',
      'Zwischendurch unsicher, am Ende aber stabil.',
      'Social Media Scroll — danach leer statt entspannt.',
      'Schlecht geschlafen, Tag fühlte sich von Anfang an schwer an.',
      'Endlich eine Aufgabe abgehakt, die ich wochenlang vor mir herschob.',
      'Kleiner Fortschritt beim Projekt: ein Bug weniger, Motivation wieder da.',
    ],
    grid_x: [-1.5, 1.5],
    grid_y: [-3, 3],
    person: null,
    location: null,
    activity: null,
    body_state: null,
  },
]

const REFRAMES = [
  'Ich habe trotzdem etwas geschafft — auch kleine Schritte zählen.',
  'Der Konflikt war nicht persönlich gemeint; morgen kann ich nochmal nachfragen.',
  'Müdigkeit ist ein Signal, kein Versagen.',
  'Ein schlechter Tag ist nicht mein gesamtes Leben.',
]

const TITLES = ['Kleiner Sieg', 'Schwerer Tag', 'Zwischendurch', 'Notiz', 'Reflexion']

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function pickScenario() {
  const total = SCENARIOS.reduce((s, sc) => s + sc.weight, 0)
  let r = Math.random() * total
  for (const sc of SCENARIOS) {
    r -= sc.weight
    if (r <= 0) return sc
  }
  return SCENARIOS[SCENARIOS.length - 1]
}

/** Build ~TARGET_COUNT dates over the last ~380 days with busy/quiet rhythms. */
function buildDates() {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - 380)

  const dates = []
  let d = new Date(start)

  let weekIndex = 0
  while (d <= today && dates.length < TARGET_COUNT + 20) {
    const daysFromEnd = Math.floor((today - d) / 86400000)
    const month = d.getMonth()
    const winter = month === 11 || month <= 1

    const phase = weekIndex % 5
    const busyPhase = phase < 3
    let weekTarget = busyPhase ? rand(2.2, 4.5) : rand(0.3, 1.4)
    if (daysFromEnd < 45) weekTarget += 1.2
    if (winter) weekTarget *= 0.85

    for (let day = 0; day < 7 && dates.length < TARGET_COUNT + 20; day++) {
      const dayDate = new Date(d)
      dayDate.setDate(dayDate.getDate() + day)
      if (dayDate > today) break

      const p = weekTarget / 7
      const burst = Math.random() < 0.12 ? 2 : 1
      for (let b = 0; b < burst; b++) {
        if (Math.random() < p && dates.length < TARGET_COUNT + 25) {
          const at = new Date(dayDate)
          at.setHours(
            7 + Math.floor(rand(0, 14)),
            Math.floor(rand(0, 60)),
            Math.floor(rand(0, 60)),
          )
          dates.push(at)
        }
      }
    }
    d.setDate(d.getDate() + 7)
    weekIndex++
  }

  dates.sort((a, b) => a - b)

  while (dates.length > TARGET_COUNT) {
    const i = Math.floor(Math.random() * dates.length)
    dates.splice(i, 1)
  }
  while (dates.length < TARGET_COUNT) {
    const at = new Date(today)
    at.setDate(at.getDate() - Math.floor(rand(0, 60)))
    at.setHours(Math.floor(rand(8, 21)), Math.floor(rand(0, 59)), 0)
    dates.push(at)
  }
  dates.sort((a, b) => a - b)
  return dates.slice(0, TARGET_COUNT)
}

function entryFromScenario(scenario, at, index) {
  const month = at.getMonth()
  const winter = month === 11 || month <= 1
  const summer = month >= 5 && month <= 8

  let bias = 0
  if (winter) bias = -0.8
  if (summer) bias = 0.6
  if (index > TARGET_COUNT - 25) bias += 0.5

  const [gxMin, gxMax] = scenario.grid_x
  let grid_x = rand(gxMin + bias, gxMax + bias)
  grid_x = clamp(Math.round(grid_x * 2) / 2, -5, 5)

  const [gyMin, gyMax] = scenario.grid_y
  let grid_y = rand(gyMin, gyMax)
  grid_y = clamp(Math.round(grid_y * 2) / 2, -5, 5)

  const text = pick(scenario.texts)

  let body_state = null
  if (scenario.body_state?.length) {
    if (grid_x <= -1.5 && Math.random() < 0.65) {
      body_state = pick(scenario.body_state.filter(s => s !== 'calm') || scenario.body_state)
    } else if (grid_x >= 1.5 && Math.random() < 0.45) {
      body_state = scenario.body_state.includes('calm') ? 'calm' : pick(scenario.body_state)
    }
  }

  let reframe = null
  if (grid_x < 0 && Math.random() < 0.38) {
    reframe = pick(REFRAMES)
  }

  const title = Math.random() < 0.2 ? pick(TITLES) : null

  return {
    text,
    title,
    grid_x,
    grid_y,
    reframe,
    person: scenario.person,
    location: scenario.location,
    activity: scenario.activity,
    body_state,
    created_at: at.toISOString(),
  }
}

function entryForDate(at, index) {
  return entryFromScenario(pickScenario(), at, index)
}

async function clearUserJournalData(supabase, userId) {
  const tables = [
    'mirror_sessions',
    'mirror_candidates',
    'implementation_intentions',
    'entries',
  ]

  for (const table of tables) {
    const { count, error: countError } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      console.error(`Count failed (${table}):`, countError.message)
      process.exit(1)
    }

    const n = count ?? 0
    if (n === 0) continue

    const { error: delError } = await supabase.from(table).delete().eq('user_id', userId)
    if (delError) {
      console.error(`Delete failed (${table}):`, delError.message)
      process.exit(1)
    }
    console.log(`  Cleared ${n} row(s) from ${table}`)
  }
}

async function resolveUserId(supabase) {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 })
  if (error) throw error
  const users = data?.users ?? []
  if (!users.length) {
    console.error('No auth users found. Sign up once in the app, then re-run.')
    process.exit(1)
  }
  if (email) {
    const u = users.find(x => x.email?.toLowerCase() === email.toLowerCase())
    if (!u) {
      console.error(`No user with email ${email}. Known: ${users.map(x => x.email).join(', ')}`)
      process.exit(1)
    }
    return u.id
  }
  if (users.length === 1) return users[0].id
  console.log('Users:')
  users.forEach((u, i) => console.log(`  ${i + 1}. ${u.email ?? u.id}`))
  console.error('Pass --email <address> to choose a user.')
  process.exit(1)
}

async function main() {
  const { url, key } = loadSupabaseEnv()

  if (clearFirst && !isLocalSupabaseUrl(url)) {
    console.error(
      '--clear is only allowed on local Supabase (127.0.0.1 / localhost).\n' +
        `Refusing to wipe data at: ${url}`,
    )
    process.exit(1)
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const userId = await resolveUserId(supabase)

  if (clearFirst) {
    console.log(`Clearing journal + mirror data for user ${userId}…`)
    if (dryRun) {
      console.log('Dry run — would clear tables, then insert (no changes).')
    } else {
      await clearUserJournalData(supabase, userId)
    }
  }

  const dates = buildDates()
  const rows = dates.map((at, i) => ({
    user_id: userId,
    ...entryForDate(at, i),
  }))

  const oldest = rows[0].created_at.slice(0, 10)
  const newest = rows[rows.length - 1].created_at.slice(0, 10)
  const neg = rows.filter(r => r.grid_x < 0).length
  const pos = rows.filter(r => r.grid_x > 0).length
  const withBibliothek = rows.filter(r => r.location === 'Bibliothek').length
  const withTom = rows.filter(r => r.person === 'Tom').length

  console.log(`Prepared ${rows.length} entries (target ${TARGET_COUNT}) for user ${userId}`)
  console.log(`  Range: ${oldest} → ${newest}`)
  console.log(`  Valence: ${pos} positive, ${neg} negative, ${rows.length - pos - neg} neutral-ish`)
  console.log(
    `  Tag examples (not totals): ${withBibliothek} entries tagged Bibliothek, ${withTom} tagged Tom`,
  )

  if (dryRun) {
    console.log('Dry run — no insert.')
    return
  }

  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const { error } = await supabase.from('entries').insert(chunk)
    if (error) {
      console.error('Insert failed:', error.message)
      process.exit(1)
    }
    inserted += chunk.length
    process.stdout.write(`\rInserted ${inserted}/${rows.length}`)
  }
  console.log('\nDone. Reload the app to see Zeitspur, Kalender, and Timeline.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
