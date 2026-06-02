/** Browser + host `npm run dev` — must be reachable from the user's machine. */
export function getPublicSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!
}

/** Server in Docker — reaches Supabase on the host via host.docker.internal. */
export function getServerSupabaseUrl(): string {
  return process.env.SUPABASE_URL ?? getPublicSupabaseUrl()
}

/**
 * Cookie / storage key must match the *public* URL hostname, not the server URL.
 * @supabase/supabase-js uses `sb-${hostname.split('.')[0]}-auth-token`.
 * Browser: 127.0.0.1 → sb-127-auth-token; host.docker.internal → sb-host-auth-token (wrong).
 */
export function getSupabaseStorageKey(): string {
  const hostname = new URL(getPublicSupabaseUrl()).hostname.split('.')[0]
  return `sb-${hostname}-auth-token`
}
