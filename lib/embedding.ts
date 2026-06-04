/** Shared embedding helpers (mirrors supabase/functions/_shared/embedding.ts). */

export const EMBEDDING_DIM = 1024
export const MISTRAL_EMBED_MODEL = 'mistral-embed'
export const MISTRAL_EMBED_URL = 'https://api.mistral.ai/v1/embeddings'

export interface EmbedRecord {
  id: string
  text: string
  person?: string | null
  location?: string | null
  activity?: string | null
  body_state?: string | null
}

export function buildEmbedInput(record: EmbedRecord): string {
  const tags = [record.person, record.location, record.activity, record.body_state]
    .filter((t): t is string => !!t && t.trim().length > 0)
    .map(t => `[${t.trim()}]`)
  const prefix = tags.join('')
  const text = (record.text ?? '').trim()
  return prefix ? `${prefix} ${text}` : text
}

export async function fetchMistralEmbedding(input: string, apiKey: string): Promise<number[]> {
  const res = await fetch(MISTRAL_EMBED_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MISTRAL_EMBED_MODEL, input }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Mistral embed failed (${res.status}): ${body}`)
  }

  const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> }
  const embedding = json.data?.[0]?.embedding
  if (!embedding || embedding.length !== EMBEDDING_DIM) {
    throw new Error(`Expected ${EMBEDDING_DIM}-dim embedding, got ${embedding?.length ?? 0}`)
  }
  return embedding
}
