#!/usr/bin/env npx tsx
/**
 * Mirror detector test — real Supabase data.
 *
 * Usage:
 *   npm run test:mirror
 *   npm run test:mirror -- --email you@example.com
 *
 * With NEXT_PUBLIC_MIRROR_DEV_MODE=true in .env.local:
 *   defaults to mirror-test@local.dev on local Supabase (supabase start)
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (or local supabase status)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  detectAllPhase1,
  type MirrorCandidate,
  type MirrorSource,
} from '../lib/patternDetection'
import { runWgarmEc, toWgarmEntry, type ValenceShiftCandidate } from '../lib/wgarmEc'
import type { Entry } from '../lib/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DEV_MIRROR_EMAIL = 'mirror-test@local.dev'

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

function isMirrorDevMode(fromLocal: Record<string, string>): boolean {
  return (process.env.NEXT_PUBLIC_MIRROR_DEV_MODE ?? fromLocal.NEXT_PUBLIC_MIRROR_DEV_MODE) === 'true'
}

function loadLocalSupabaseEnv(): { url: string; key: string } | null {
  try {
    const raw = execSync('supabase status -o env 2>/dev/null', { cwd: ROOT, encoding: 'utf8' })
    let url: string | undefined
    let key: string | undefined
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/)
      if (!m) continue
      const v = m[2].replace(/^"|"$/g, '')
      if (m[1] === 'API_URL') url = v
      if (m[1] === 'SERVICE_ROLE_KEY') key = v
    }
    return url && key ? { url, key } : null
  } catch {
    return null
  }
}

function loadSupabaseEnv(forceLocal = false): { url: string; key: string } {
  const fromLocal = loadDotEnv(resolve(ROOT, '.env.local'))

  if (forceLocal) {
    const local = loadLocalSupabaseEnv()
    if (!local) {
      console.error('NEXT_PUBLIC_MIRROR_DEV_MODE=true requires local Supabase (supabase start)')
      process.exit(1)
    }
    return local
  }

  let url = process.env.SUPABASE_URL
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY

  const local = loadLocalSupabaseEnv()
  if (local) {
    url = local.url
    key = local.key
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

// ── WGARM-EC (TypeScript) ───────────────────────────────────────────────────

function runValenceShiftCandidates(entries: EntryRow[]): TestCandidate[] {
  const wgarmEntries = entries.map(toWgarmEntry).filter(Boolean)
  if (wgarmEntries.length < 20) return []

  const result = runWgarmEc(wgarmEntries)
  if (result.error) return []

  const byId = new Map(entries.map(e => [e.id, e]))
  return result.valence_shift_candidates.map((c: ValenceShiftCandidate) => ({
    source: c.source,
    signalStrength: c.signal_strength,
    templateText: c.template_text,
    antecedent: `cluster ${c.pattern_metadata.cluster_id}`,
    consequent: `shift ${c.pattern_metadata.shift.toFixed(2)}`,
    confidence: null,
    lift: null,
    spanDays: c.pattern_metadata.span_days,
    occurrenceCount: c.pattern_metadata.occurrence_count,
    displayEntries: [c.pattern_metadata.entry_early, c.pattern_metadata.entry_late]
      .map(id => byId.get(id))
      .filter((e): e is Entry => !!e),
  }))
}
function runWgarmEcCandidates(entries: EntryRow[]): TestCandidate[] {
  const wgarmEntries = entries.map(toWgarmEntry).filter(Boolean)
  if (wgarmEntries.length < 20) return []

  const result = runWgarmEc(wgarmEntries)
  if (result.error) {
    console.error(`WGARM-EC: ${result.error}`)
    return []
  }

  const byId = new Map(entries.map(e => [e.id, e]))
  return result.mirror_candidates.map(c => ({
    source: c.source,
    signalStrength: c.signal_strength,
    templateText: c.template_text,
    antecedent: c.pattern_metadata.antecedent.join(', ') || '—',
    consequent: c.pattern_metadata.consequent.join(', ') || '—',
    confidence: c.pattern_metadata.confidence,
    lift: c.pattern_metadata.lift,
    spanDays: c.pattern_metadata.span_days,
    occurrenceCount: c.pattern_metadata.occurrence_count,
    displayEntries: (c.pattern_metadata.anchor_entry_ids.length
      ? c.pattern_metadata.anchor_entry_ids
      : c.entry_ids.slice(0, 3))
      .map(id => byId.get(id))
      .filter((e): e is Entry => !!e),
  }))
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
  if (c.source === 'grid_cluster') {
    const m = c.introText.match(/die sich (.+?) anfühlen/)
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
  return {
    source: c.source,
    signalStrength: c.signalStrength,
    templateText: c.introText,
    antecedent: 'valence_shift',
    consequent: `${c.count}×`,
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
  const fromLocal = loadDotEnv(resolve(ROOT, '.env.local'))
  const devMode = isMirrorDevMode(fromLocal)
  const emailArg = args.includes('--email') ? args[args.indexOf('--email') + 1] ?? null : null
  const email = emailArg ?? (devMode ? DEV_MIRROR_EMAIL : null)

  const { url, key } = loadSupabaseEnv(devMode)
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
  if (devMode) console.log(`Dev mode: ${email ?? 'first user with entries'} @ ${url}`)
  console.log(`Einträge gesamt: ${entries.length}`)
  console.log('─────────────────────────────────────')
  console.log('')

  const candidates: TestCandidate[] = [
    ...detectAllPhase1(entries).map(c => phase1ToTest(c, byId)),
    ...runWgarmEcCandidates(entries),
    ...runValenceShiftCandidates(entries),
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
