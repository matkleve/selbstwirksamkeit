import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Fast auth gate from JWT claims (no Auth server round-trip when session cookie is valid). */
export async function getUserFromClaims(supabase: SupabaseClient): Promise<User | null> {
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  const sub = claims?.sub
  if (error || !sub || typeof sub !== 'string') return null

  return {
    id: sub,
    email: typeof claims.email === 'string' ? claims.email : undefined,
  } as User
}
