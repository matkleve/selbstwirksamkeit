import type { CookieOptions } from '@supabase/ssr'
import { getSupabaseStorageKey } from '@/lib/supabase-url'

export type SupabaseCookieToSet = {
  name: string
  value: string
  options: CookieOptions
}

/** Storage key must follow NEXT_PUBLIC_SUPABASE_URL, not SUPABASE_URL (Docker). */
export function getSupabaseCookieOptions() {
  return { name: getSupabaseStorageKey() } as const
}
