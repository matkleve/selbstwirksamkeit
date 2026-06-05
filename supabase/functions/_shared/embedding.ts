export const EMBEDDING_DIM = 1024
export const MISTRAL_EMBED_MODEL = 'mistral-embed'
export const MISTRAL_EMBED_URL = 'https://api.mistral.ai/v1/embeddings'

const BODY_STATE_LABELS: Record<string, string> = {
  stressed: 'gestresst',
  calm: 'ruhig',
  tired: 'müde',
}

export interface EmbedRecord {
  id: string
  text: string
  person?: string | null
  location?: string | null
  activity?: string | null
  body_state?: string | null
}

function splitMetaValues(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean)
}

function embedBracketTags(record: EmbedRecord): string[] {
  const tags: string[] = []
  for (const p of splitMetaValues(record.person ?? '')) tags.push(p)
  for (const l of splitMetaValues(record.location ?? '')) tags.push(l)
  for (const a of splitMetaValues(record.activity ?? '')) tags.push(a)
  if (record.body_state?.trim()) {
    const raw = record.body_state.trim()
    tags.push(BODY_STATE_LABELS[raw] ?? raw)
  }
  return tags
}

/** Spec format: "[{tag1}][{tag2}] {freitext}" — one bracket per atomic meta value. */
export function buildEmbedInput(record: EmbedRecord): string {
  const prefix = embedBracketTags(record)
    .map(t => `[${t}]`)
    .join('')
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

  const json = await res.json() as { data?: Array<{ embedding?: number[] }> }
  const embedding = json.data?.[0]?.embedding
  if (!embedding || embedding.length !== EMBEDDING_DIM) {
    throw new Error(`Expected ${EMBEDDING_DIM}-dim embedding, got ${embedding?.length ?? 0}`)
  }
  return embedding
}
