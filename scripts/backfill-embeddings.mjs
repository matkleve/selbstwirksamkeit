#!/usr/bin/env node
/**
 * Backfill entry embeddings via Mistral mistral-embed.
 *
 * Usage:
 *   node scripts/backfill-embeddings.mjs
 *   node scripts/backfill-embeddings.mjs --email you@example.com
 *   node scripts/backfill-embeddings.mjs --dry-run
 *
 * Requires: MISTRAL_API_KEY, SUPABASE_SERVICE_ROLE_KEY (or local supabase status)
 * Batches: max 50 entries per Mistral API call
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const BATCH = 50
const EMBEDDING_DIM = 1024
const MISTRAL_URL = 'https://api.mistral.ai/v1/embeddings'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const email = args.includes('--email') ? args[args.indexOf('--email') + 1] : null

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

function loadEnv() {
  const fromLocal = loadDotEnv(resolve(ROOT, '.env.local'))
  let url = process.env.SUPABASE_URL
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const mistral = process.env.MISTRAL_API_KEY || fromLocal.MISTRAL_API_KEY

  // Prefer local Supabase CLI when running (host-side dev)
  try {
    const raw = execSync('supabase status -o env 2>/dev/null', { cwd: ROOT, encoding: 'utf8' })
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/)
      if (!m) continue
      const v = m[2].replace(/^"|"$/g, '')
      if (m[1] === 'API_URL') url = v
      if (m[1] === 'SERVICE_ROLE_KEY') key = v
    }
  } catch { /* not local */ }

  if (!url) {
    url = fromLocal.NEXT_PUBLIC_SUPABASE_URL || fromLocal.SUPABASE_URL
    if (url?.includes('host.docker.internal')) url = 'http://127.0.0.1:54321'
  }
  if (!key) key = fromLocal.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) throw new Error('Missing Supabase URL or SERVICE_ROLE_KEY')
  if (!mistral) throw new Error('Missing MISTRAL_API_KEY in .env.local')
  return { url, key, mistral }
}

function buildEmbedInput(row) {
  const tags = [row.person, row.location, row.activity, row.body_state]
    .filter(Boolean)
    .map(t => `[${t}]`)
  const prefix = tags.join('')
  const text = (row.text ?? '').trim()
  return prefix ? `${prefix} ${text}` : text
}

async function mistralEmbedBatch(inputs, apiKey) {
  const res = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'mistral-embed', input: inputs }),
  })
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return json.data.map(d => d.embedding)
}

async function resolveUserId(supabase, emailAddr) {
  if (emailAddr) {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (error) throw error
    const u = data.users.find(x => x.email === emailAddr)
    if (!u) throw new Error(`User not found: ${emailAddr}`)
    return u.id
  }
  const { data, error } = await supabase.from('entries').select('user_id').limit(1)
  if (error) throw error
  if (!data?.length) throw new Error('No entries in database')
  return data[0].user_id
}

async function main() {
  const { url, key, mistral } = loadEnv()
  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const userId = await resolveUserId(supabase, email)

  const { data: rows, error } = await supabase
    .from('entries')
    .select('id,text,person,location,activity,body_state')
    .eq('user_id', userId)
    .is('embedding', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  const pending = rows ?? []

  console.log(`Backfill: ${pending.length} entries without embedding`)
  if (pending.length === 0) {
    console.log('Nothing to do.')
    return
  }

  if (dryRun) {
    console.log('Dry run — first input:', buildEmbedInput(pending[0]))
    return
  }

  let done = 0
  for (let i = 0; i < pending.length; i += BATCH) {
    const batch = pending.slice(i, i + BATCH)
    const inputs = batch.map(buildEmbedInput)
    const embeddings = await mistralEmbedBatch(inputs, mistral)

    if (embeddings.length !== batch.length) {
      throw new Error(`Expected ${batch.length} embeddings, got ${embeddings.length}`)
    }

    for (let j = 0; j < batch.length; j++) {
      const emb = embeddings[j]
      if (emb.length !== EMBEDDING_DIM) {
        throw new Error(`Wrong dimension ${emb.length} for entry ${batch[j].id}`)
      }
      const { error: upErr } = await supabase
        .from('entries')
        .update({ embedding: emb })
        .eq('id', batch[j].id)
      if (upErr) throw upErr
      done++
    }
    process.stdout.write(`\rEmbedded ${done}/${pending.length}`)
  }

  console.log('\nDone.')

  const { data: sample } = await supabase
    .from('entries')
    .select('id, embedding')
    .eq('user_id', userId)
    .not('embedding', 'is', null)
    .limit(1)
    .single()

  if (sample?.embedding) {
    const vec = typeof sample.embedding === 'string' ? JSON.parse(sample.embedding) : sample.embedding
    console.log(`Example (${sample.id}) first 5 dims: [${vec.slice(0, 5).map(n => n.toFixed(4)).join(', ')}]`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
