'use server'

import { isMirrorDevMode } from '@/lib/mirror-config'
import type { MirrorCandidate } from '@/lib/patternDetection'
import { fetchNextMirrorCandidate } from '@/lib/mirror-resolve'
import { getServerUser } from '@/lib/server-entries'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ENTRY_SELECT } from '@/lib/entry-fields'

export type OpenMirrorCandidateResult =
  | { ok: true; candidate: MirrorCandidate | null }
  | { ok: false; message: string }

export async function openMirrorCandidate(): Promise<OpenMirrorCandidateResult> {
  try {
    const user = await getServerUser()
    if (!user) {
      return { ok: false, message: 'Nicht angemeldet. Bitte Seite neu laden.' }
    }

    const supabase = await createServerSupabaseClient()

    if (isMirrorDevMode()) {
      const { data: entries, error } = await supabase
        .from('entries')
        .select(`${ENTRY_SELECT},embedding`)
        .order('created_at', { ascending: true })

      if (error) {
        return { ok: false, message: error.message }
      }

      const candidate = await fetchNextMirrorCandidate(supabase, user.id, entries ?? [])
      return { ok: true, candidate }
    }

    const candidate = await fetchNextMirrorCandidate(supabase, user.id, [])
    return { ok: true, candidate }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Spiegel konnte nicht geladen werden.'
    return { ok: false, message }
  }
}
