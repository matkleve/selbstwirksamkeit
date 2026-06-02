import { createBrowserClient } from '@supabase/ssr'
import { getPublicSupabaseUrl } from '@/lib/supabase-url'

export function createClient() {
  return createBrowserClient(
    getPublicSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
