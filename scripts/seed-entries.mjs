#!/usr/bin/env node
/**
 * Seed ~150 journal entries over the past year (varied density + patterns).
 *
 * Usage:
 *   node scripts/seed-entries.mjs
 *   node scripts/seed-entries.mjs --email you@example.com
 *   node scripts/seed-entries.mjs --dry-run
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
const emailFlag = args.find((a, i) => a === '--email' && args[i + 1])
const email = emailFlag ? args[args.indexOf('--email') + 1] : null

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

  // Host-side scripts: prefer local CLI over Docker-internal URLs
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

const POS_TEXTS = [
  'Präsentation lief besser als erwartet — habe mich danach leicht und klar gefühlt.',
  'Spontan mit Freunden gegessen, ohne schlechtes Gewissen danach.',
  'Kleiner Fortschritt beim Projekt: ein Bug weniger, Motivation wieder da.',
  'Morgenspaziergang hat den Kopf frei gemacht.',
  'Kompliment im Teammeeting — kurz unsicher, dann stolz.',
  'Endlich eine Aufgabe abgehakt, die ich wochenlang vor mir herschob.',
  'Gutes Feedback von der Betreuung — fühlt sich nach echter Entwicklung an.',
  'Habe heute Nein gesagt, ohne mich schuldig zu fühlen.',
]

const NEG_TEXTS = [
  'Abends wieder zu lange am Bildschirm — am nächsten Tag müde und gereizt.',
  'Gespräch mit Vorgesetztem lief schief; ich war danach innerlich laut.',
  'Vergleiche mich mit anderen — kurz alles fühlt sich kleiner an.',
  'Deadline-Stress: konnte kaum abschalten.',
  'Konflikt mit Mitbewohner wegen Lärm — bin danach angespannt geblieben.',
  'Lernblockade: drei Stunden gesessen, wenig geschafft.',
  'Schlecht geschlafen, Tag fühlte sich von Anfang an schwer an.',
  'Social Media Scroll — danach leer statt entspannt.',
]

const NEUTRAL_TEXTS = [
  'Routine-Tag: Vorlesung, Bibliothek, früh ins Bett.',
  'Einkaufen erledigt, Wohnung aufgeräumt — nichts Großes, aber okay.',
  'Viel unterwegs gewesen, abends müde aber zufrieden.',
  'Zwischendurch unsicher, am Ende aber stabil.',
]

const REFRAMES = [
  'Ich habe trotzdem etwas geschafft — auch kleine Schritte zählen.',
  'Der Konflikt war nicht persönlich gemeint; morgen kann ich nochmal nachfragen.',
  'Müdigkeit ist ein Signal, kein Versagen.',
  'Ein schlechter Tag ist nicht mein gesamtes Leben.',
]

const PEOPLE = ['Anna', 'Tom', 'Betreuerin Dr. Weber', 'Mitbewohner', 'Team Lead', 'Mama']
const LOCATIONS = ['Bibliothek', 'Campus', 'Zuhause', 'Büro', 'Café Mitte', 'Park']
const ACTIVITIES = ['Lernen', 'Präsentation', 'Meeting', 'Sport', 'Kochen', 'Bewerbung']

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
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

    // 3-week busy / 2-week quiet cycle
    const phase = weekIndex % 5
    const busyPhase = phase < 3
    let weekTarget = busyPhase ? rand(2.2, 4.5) : rand(0.3, 1.4)
    if (daysFromEnd < 45) weekTarget += 1.2 // recent streak
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

  // Trim or pad to TARGET_COUNT
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

function entryForDate(at, index) {
  const month = at.getMonth()
  const winter = month === 11 || month <= 1
  const summer = month >= 5 && month <= 8

  let bias = 0
  if (winter) bias = -1.2
  if (summer) bias = 1.0
  if (index > TARGET_COUNT - 25) bias += 0.6 // recent upswing

  const roll = Math.random()
  let grid_x
  if (roll < 0.38) grid_x = rand(0.5 + bias, 4.5)
  else if (roll < 0.72) grid_x = rand(-4.5, -0.5 + bias * 0.5)
  else grid_x = rand(-1.5, 1.5)

  grid_x = clamp(Math.round(grid_x * 2) / 2, -5, 5)
  const grid_y =
    Math.random() < 0.55
      ? clamp(Math.round(rand(-4, 4) * 2) / 2, -5, 5)
      : grid_x >= 0
        ? clamp(Math.round(rand(0.5, 4) * 2) / 2, -5, 5)
        : clamp(Math.round(rand(-4, -0.5) * 2) / 2, -5, 5)

  let text
  if (grid_x >= 2) text = pick(POS_TEXTS)
  else if (grid_x <= -2) text = pick(NEG_TEXTS)
  else text = pick(NEUTRAL_TEXTS)

  const hasMeta = Math.random() < 0.62
  const person = hasMeta && Math.random() < 0.7 ? pick(PEOPLE) : null
  const location = hasMeta && Math.random() < 0.65 ? pick(LOCATIONS) : null
  const activity = hasMeta && Math.random() < 0.55 ? pick(ACTIVITIES) : null

  let body_state = null
  if (grid_x <= -2 && Math.random() < 0.55) {
    body_state = pick(['stressed', 'tired', 'stressed'])
  } else if (grid_x >= 2 && Math.random() < 0.4) {
    body_state = 'calm'
  }

  let reframe = null
  if (grid_x < 0 && Math.random() < 0.42) {
    reframe = pick(REFRAMES)
  }

  const title =
    Math.random() < 0.22
      ? ['Kleiner Sieg', 'Schwerer Tag', 'Zwischendurch', 'Notiz', 'Reflexion'][Math.floor(Math.random() * 5)]
      : null

  return {
    text,
    title,
    grid_x,
    grid_y,
    reframe,
    person,
    location,
    activity,
    body_state,
    created_at: at.toISOString(),
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
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const userId = await resolveUserId(supabase)
  const dates = buildDates()
  const rows = dates.map((at, i) => ({
    user_id: userId,
    ...entryForDate(at, i),
  }))

  const oldest = rows[0].created_at.slice(0, 10)
  const newest = rows[rows.length - 1].created_at.slice(0, 10)
  const neg = rows.filter(r => r.grid_x < 0).length
  const pos = rows.filter(r => r.grid_x > 0).length

  console.log(`Prepared ${rows.length} entries for user ${userId}`)
  console.log(`  Range: ${oldest} → ${newest}`)
  console.log(`  Valence: ${pos} positive, ${neg} negative, ${rows.length - pos - neg} neutral-ish`)

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
