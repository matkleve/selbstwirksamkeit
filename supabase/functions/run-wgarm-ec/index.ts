import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  runWgarmEc,
  toWgarmEntry,
} from '../_shared/wgarmEc.ts'

interface DbEntry {
  id: string
  user_id: string
  text: string
  grid_x: number | null
  grid_y: number | null
  person: string | null
  location: string | null
  activity: string | null
  body_state: string | null
  created_at: string
  embedding: number[] | string | null
}

const ENTRY_SELECT =
  'id,user_id,text,grid_x,grid_y,person,location,activity,body_state,created_at,embedding'

async function processUser(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: rows, error } = await supabase
    .from('entries')
    .select(ENTRY_SELECT)
    .eq('user_id', userId)
    .not('embedding', 'is', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  const wgarmEntries = (rows as DbEntry[]).map(toWgarmEntry).filter(Boolean)
  if (wgarmEntries.length < 10) return { userId, inserted: 0, rules: 0 }

  const result = runWgarmEc(wgarmEntries)
  if (result.error) return { userId, inserted: 0, rules: 0, error: result.error }

  const ranked = result.mirror_candidates
    .filter(c => c.signal_strength !== 'weak')
    .sort((a, b) => b.pattern_metadata.lift - a.pattern_metadata.lift)

  const seen = new Set<string>()
  let inserted = 0
  for (const c of ranked) {
    if (seen.has(c.template_text) || inserted >= 3) continue
    seen.add(c.template_text)

    const { error: insErr } = await supabase.from('mirror_candidates').insert({
      user_id: userId,
      entry_ids: c.entry_ids,
      source: 'wgarm_ec',
      signal_strength: c.signal_strength,
      template_text: c.template_text,
      question: 'Was fällt dir daran auf?',
      pattern_metadata: c.pattern_metadata,
      shown: false,
    })
    if (insErr) throw insErr
    inserted++
  }

  return { userId, inserted, rules: result.stats.rules }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Supabase env missing' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: rows, error } = await supabase
    .from('entries')
    .select('user_id')
    .not('embedding', 'is', null)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const counts = new Map<string, number>()
  for (const r of rows ?? []) {
    const uid = r.user_id as string
    counts.set(uid, (counts.get(uid) ?? 0) + 1)
  }

  const userIds = [...counts.entries()].filter(([, n]) => n >= 10).map(([id]) => id)
  const results = []

  for (const userId of userIds) {
    results.push(await processUser(supabase, userId))
  }

  return new Response(
    JSON.stringify({
      ok: true,
      users_processed: userIds.length,
      results,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
