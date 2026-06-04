#!/usr/bin/env npx tsx
/**
 * Mirror detector test — real Supabase data.
 *
 * Usage:
 *   npx tsx scripts/test-mirror.ts
 *   npx tsx scripts/test-mirror.ts --email you@example.com
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (or local supabase status)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  detectAllPhase1,
  type MirrorCandidate,
  type MirrorSource,
} from '../lib/patternDetection'
import type { Entry } from '../lib/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const WGARM_DIR = resolve(ROOT, 'services/wgarm-ec')

const STRENGTH_ORDER = { strong: 0, moderate: 1, weak: 2 } as const

type EntryRow = Entry & { embedding?: number[] | string | null }

interface TestCandidate {
  source: MirrorSource
  signalStrength: 'weak' | 'moderate' | 'strong'
  templateText: string
  antecedent: string
  consequent: string
  confidence: number | null
  lift: number | null
  spanDays: number
  occurrenceCount: number
  displayEntries: Entry[]
}

// ── env (same pattern as seed-entries.mjs) ──────────────────────────────────

function loadDotEnv(path: string): Record<string, string> {
  if (!existsSync(path)) return {}
  const out: Record<string, string> = {}
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

function loadSupabaseEnv(): { url: string; key: string } {
  const fromLocal = loadDotEnv(resolve(ROOT, '.env.local'))
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
    url = fromLocal.NEXT_PUBLIC_SUPABASE_URL || fromLocal.SUPABASE_URL
    if (url?.includes('host.docker.internal')) url = 'http://127.0.0.1:54321'
  }
  if (!key) key = fromLocal.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('Missing Supabase URL or SERVICE_ROLE_KEY (.env.local or supabase status)')
    process.exit(1)
  }
  return { url, key }
}

// ── WGARM-EC ────────────────────────────────────────────────────────────────

function parseEmbedding(raw: number[] | string | null | undefined): number[] | null {
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

function toWgarmPayload(entries: EntryRow[]) {
  return entries.map(e => {
    const dt = new Date(e.created_at)
    const tags = [e.person, e.location, e.activity, e.body_state].filter(Boolean) as string[]
    return {
      id: e.id,
      created_at: e.created_at,
      grid_x: (e.grid_x ?? 0) / 5,
      grid_y: (e.grid_y ?? 0) / 5,
      mood_tags: tags,
      hour_of_day: dt.getHours(),
      day_of_week: dt.getDay() === 0 ? 6 : dt.getDay() - 1,
      text: e.text,
      embedding: parseEmbedding(e.embedding),
    }
  })
}

function runWgarmEc(entries: EntryRow[]): TestCandidate[] {
  const withEmb = entries.filter(e => parseEmbedding(e.embedding))
  if (withEmb.length === 0) return []

  const payload = JSON.stringify({ entries: toWgarmPayload(withEmb) })

  const attempts: { cmd: string; args: string[]; cwd?: string; input?: string }[] = [
    { cmd: 'python3', args: ['run_json.py'], cwd: WGARM_DIR, input: payload },
    {
      cmd: 'docker',
      args: ['run', '--rm', '-i', 'wgarm-ec-test', 'python', 'run_json.py'],
      cwd: WGARM_DIR,
      input: payload,
    },
  ]

  for (const { cmd, args, cwd, input } of attempts) {
    const r = spawnSync(cmd, args, {
      cwd,
      input,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    })
    if (r.status !== 0) continue
    try {
      const parsed = JSON.parse(r.stdout) as {
        error?: string
        candidates: Array<{
          entry_ids: string[]
          source: MirrorSource
          signal_strength: 'weak' | 'moderate' | 'strong'
          template_text: string
          antecedent: string[]
          consequent: string[]
          confidence: number | null
          lift: number | null
          span_days: number
          occurrence_count: number
          anchor_entry_ids: string[]
        }>
      }
      if (parsed.error) return []
      const byId = new Map(entries.map(e => [e.id, e]))
      return parsed.candidates.map(c => ({
        source: c.source,
        signalStrength: c.signal_strength,
        templateText: c.template_text,
        antecedent: c.antecedent.join(', ') || '—',
        consequent: c.consequent.join(', ') || '—',
        confidence: c.confidence,
        lift: c.lift,
        spanDays: c.span_days,
        occurrenceCount: c.occurrence_count,
        displayEntries: (c.anchor_entry_ids.length ? c.anchor_entry_ids : c.entry_ids.slice(0, 3))
          .map(id => byId.get(id))
          .filter((e): e is Entry => !!e),
      }))
    } catch {
      continue
    }
  }

  console.error('(WGARM-EC skipped: python3/docker unavailable or numpy missing)')
  return []
}

// ── Phase 1 → TestCandidate ─────────────────────────────────────────────────

function spanDays(ids: string[], byId: Map<string, Entry>): number {
  const times = ids.map(id => new Date(byId.get(id)!.created_at).getTime()).sort((a, b) => a - b)
  if (times.length < 2) return 0
  return Math.round((times[times.length - 1]! - times[0]!) / (24 * 60 * 60 * 1000))
}

function phase1ToTest(c: MirrorCandidate, byId: Map<string, Entry>): TestCandidate {
  if (c.source === 'tag_frequency') {
    const m = c.introText.match(/„([^"]+)"/)
    return {
      source: c.source,
      signalStrength: c.signalStrength,
      templateText: c.introText,
      antecedent: m?.[1] ?? 'tag',
      consequent: `recurrence (${c.count}×)`,
      confidence: null,
      lift: null,
      spanDays: spanDays(c.entryIds, byId),
      occurrenceCount: c.count,
      displayEntries: c.entries,
    }
  }
  const m = c.introText.match(/Bereich ([^—]+)/)
  return {
    source: c.source,
    signalStrength: c.signalStrength,
    templateText: c.introText,
    antecedent: m?.[1]?.trim() ?? 'quadrant',
    consequent: `cluster (${c.count}×)`,
    confidence: null,
    lift: null,
    spanDays: spanDays(c.entryIds, byId),
    occurrenceCount: c.count,
    displayEntries: c.entries,
  }
}

// ── output ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function entryTags(e: Entry): string[] {
  return [e.person, e.location, e.activity, e.body_state].filter(Boolean) as string[]
}

function printCandidate(n: number, c: TestCandidate) {
  const conf = c.confidence != null ? `${Math.round(c.confidence * 100)}%` : '—'
  const lift = c.lift != null ? String(c.lift) : '—'

  console.log(`KANDIDAT ${n}  [${c.signalStrength}]  source: ${c.source}`)
  console.log(`Muster: ${c.antecedent} → ${c.consequent}`)
  console.log(`confidence: ${conf}  lift: ${lift}  span: ${c.spanDays}d  ${c.occurrenceCount}× erlebt`)
  console.log('')
  console.log('Text:')
  console.log(`"${c.templateText}"`)
  console.log('')
  console.log('Gewählte Karten:')

  for (const e of c.displayEntries) {
    const tags = entryTags(e)
    const snippet = e.text.slice(0, 80) + (e.text.length > 80 ? '…' : '')
    console.log(`  ┌─ ${fmtDate(e.created_at)} · ${fmtTime(e.created_at)}`)
    console.log(`  │  "${snippet}"`)
    if (tags.length) console.log(`  │  ${tags.map(t => `[${t}]`).join(' ')}`)
    console.log('  └─')
    console.log('')
  }
}

async function resolveUserId(supabase: SupabaseClient, email: string | null): Promise<string> {
  if (email) {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (error) throw error
    const u = data.users.find(x => x.email === email)
    if (!u) throw new Error(`User not found: ${email}`)
    return u.id
  }

  const { data: rows, error } = await supabase
    .from('entries')
    .select('user_id')
    .limit(1)
  if (error) throw error
  if (!rows?.length) throw new Error('No entries in database')
  return rows[0]!.user_id as string
}

async function main() {
  const args = process.argv.slice(2)
  const email = args.includes('--email') ? args[args.indexOf('--email') + 1] ?? null : null

  const { url, key } = loadSupabaseEnv()
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const userId = await resolveUserId(supabase, email)

  const { data: rows, error } = await supabase
    .from('entries')
    .select('id,user_id,title,text,grid_x,grid_y,reframe,person,location,activity,body_state,created_at,embedding')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  const entries = (rows ?? []) as EntryRow[]
  const byId = new Map(entries.map(e => [e.id, e]))

  const ts = new Date().toLocaleString('de-DE')
  console.log('─────────────────────────────────────')
  console.log(`MIRROR TEST — ${ts}`)
  console.log(`Einträge gesamt: ${entries.length}`)
  console.log('─────────────────────────────────────')
  console.log('')

  const candidates: TestCandidate[] = [
    ...detectAllPhase1(entries).map(c => phase1ToTest(c, byId)),
    ...runWgarmEc(entries),
  ].sort((a, b) => STRENGTH_ORDER[a.signalStrength] - STRENGTH_ORDER[b.signalStrength])

  if (candidates.length === 0) {
    console.log('Zu wenig Daten')
    return
  }

  candidates.forEach((c, i) => {
    printCandidate(i + 1, c)
    console.log('─────────────────────────────────────')
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
