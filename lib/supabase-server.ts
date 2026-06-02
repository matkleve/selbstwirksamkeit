import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseCookieOptions, type SupabaseCookieToSet } from '@/lib/supabase-cookies'
import { getServerSupabaseUrl } from '@/lib/supabase-url'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    getServerSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(),
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: SupabaseCookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // CookieOptions (from @supabase/ssr) and ResponseCookieInit (Next.js) are compatible
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cookieStore.set(name, value, options as any)
            )
          } catch {
            // Server Component render — middleware handles session refresh
          }
        },
      },
    }
  )
}
