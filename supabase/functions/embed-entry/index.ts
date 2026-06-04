import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  buildEmbedInput,
  fetchMistralEmbedding,
  type EmbedRecord,
} from '../_shared/embedding.ts'

interface WebhookPayload {
  type?: string
  record?: EmbedRecord
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const mistralKey = Deno.env.get('MISTRAL_API_KEY')
  if (!mistralKey) {
    return new Response(JSON.stringify({ error: 'MISTRAL_API_KEY not configured' }), { status: 500 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Supabase env missing' }), { status: 500 })
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const record = payload.record
  if (!record?.id || !record.text?.trim()) {
    return new Response(JSON.stringify({ error: 'record.id and record.text required' }), { status: 400 })
  }

  const input = buildEmbedInput(record)
  if (!input) {
    return new Response(JSON.stringify({ error: 'Empty embed input' }), { status: 400 })
  }

  try {
    const embedding = await fetchMistralEmbedding(input, mistralKey)
    const supabase = createClient(supabaseUrl, serviceKey)

    const { error } = await supabase
      .from('entries')
      .update({ embedding })
      .eq('id', record.id)
      .is('embedding', null)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true, id: record.id, dims: embedding.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg }), { status: 502 })
  }
})
