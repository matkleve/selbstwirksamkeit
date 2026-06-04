# Entry Embeddings — Specification

Version 1.1 | RFC 2119 normative language

---

## Decision

Entry text embeddings MUST be generated via **Mistral AI `mistral-embed`**.

| Option | Verdict |
|---|---|
| **Mistral `mistral-embed`** | **MUST use** — EU company (France), GDPR-aligned, strong German performance |
| OpenAI `text-embedding-3-small` | MUST NOT use |
| Supabase `gte-small` | MUST NOT use — English-only, unsuitable for German journal text |

---

## Vector storage

```
entries.embedding  extensions.vector(1024)
```

- Dimension MUST be **1024** (Mistral `mistral-embed` output size)
- pgvector extension in schema `extensions`
- HNSW index on `embedding` with `extensions.vector_cosine_ops`

### Migration note

Migration `008_embeddings_pgvector.sql` was initially written with `vector(1536)` (OpenAI assumption).  
Migration `009_embeddings_mistral.sql` MUST set `vector(1024)` and install the pg_net trigger.

---

## Embedding input format

On entry save, the text sent to the embedding API MUST be:

```
[{tag1}][{tag2}] {freitext}
```

Example:

```
[müde][zuhause] schon wieder so spät geworden
```

Tags MUST be assembled from structured fields: `person`, `location`, `activity`, `body_state` (non-null only).

---

## API call

Mistral Embeddings API is **OpenAI-compatible** — minimal client change from a generic OpenAI SDK pattern.

```
POST https://api.mistral.ai/v1/embeddings
Authorization: Bearer {MISTRAL_API_KEY}
Content-Type: application/json

{
  "model": "mistral-embed",
  "input": "[müde][zuhause] schon wieder so spät geworden"
}
```

Response: `data[0].embedding` — float array, length 1024.

### Where the call runs

| Runtime | Use |
|---|---|
| Supabase Edge Function (on entry insert/update) | Production embedding write |
| Local dev / backfill script | MAY call same API directly |

The Edge Function MUST NOT expose `MISTRAL_API_KEY` to the client.

---

## Secrets and environment

| Variable | Where | Required |
|---|---|---|
| `MISTRAL_API_KEY` | Supabase project secrets (Edge Functions) | Production |
| `MISTRAL_API_KEY` | `.env.local` (local Edge Function / backfill) | Local dev |
| `MISTRAL_API_KEY` | `.env.local.example` (documented, no real value) | Template |

`MISTRAL_API_KEY` MUST NOT be prefixed with `NEXT_PUBLIC_` — server-side only.

---

## Phase gate

Embedding generation is **Phase 2**. Implementation MUST NOT begin until:

1. This spec is confirmed by project lead
2. Phase 2 go-ahead is explicitly granted (see `pattern-mirror.md`)

---

## WGARM-EC compatibility

WGARM-EC (`services/wgarm-ec/`) consumes `float[1024]` embeddings for semantic clustering.  
Cosine similarity threshold (default 0.73) remains unchanged — dimension change does not affect threshold semantics.

---

## Out of scope

- Batch re-embedding of existing entries (separate backfill task after Phase 2 start)
- Embedding cache / deduplication across users
- Fallback to Supabase built-in models
