'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { fetchMirrorHistory } from '@/lib/mirror-session'
import { Bell, Eye } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { MirrorTitle } from '@/components/mirror/MirrorTitle'
import { RemindersPanel } from '@/components/RemindersPanel'
import MirrorFlow from '@/components/MirrorFlow'
import { MirrorNetworkLoader } from '@/components/mirror/MirrorNetworkLoader'
import { MirrorHistory } from '@/components/mirror/MirrorHistory'
import { MirrorHistoryToolbar } from '@/components/mirror/MirrorHistoryToolbar'
import { Button } from '@/components/ui/button'
import {
  MIRROR_EXHAUSTED_TEXT,
  MIRROR_LOADER_MIN_MS,
} from '@/components/mirror/MirrorFlow.constants'
import { openMirrorCandidate } from '@/lib/mirror-actions'
import { applySortFilter, type MirrorHistoryFilter, type MirrorHistorySort } from '@/lib/mirror-history-view'
import type { MirrorSessionRow } from '@/lib/mirror-session'
import type { MirrorCandidate } from '@/lib/patternDetection'
import type { Entry } from '@/lib/types'

type View = 'landing' | 'loading' | 'flow' | 'exhausted'
type MenuId = 'filter' | 'sort'

interface Props {
  initialSessions: MirrorSessionRow[]
  entriesById: Record<string, Entry>
}

export function MirrorPageView({ initialSessions, entriesById }: Props) {
  const router = useRouter()
  const [view, setView] = useState<View>('landing')
  const [candidate, setCandidate] = useState<MirrorCandidate | null>(null)
  const [sessions, setSessions] = useState(initialSessions)
  const [entriesByIdState, setEntriesByIdState] = useState(entriesById)
  const [opening, setOpening] = useState(false)
  const [remindersOpen, setRemindersOpen] = useState(false)
  const [openError, setOpenError] = useState<string | null>(null)
  const [historySort, setHistorySort] = useState<MirrorHistorySort>('newest_first')
  const [historyFilter, setHistoryFilter] = useState<MirrorHistoryFilter>('all')
  const [historyOpenMenu, setHistoryOpenMenu] = useState<MenuId | null>(null)

  useEffect(() => {
    setSessions(initialSessions)
    setEntriesByIdState(entriesById)
  }, [initialSessions, entriesById])

  const refreshHistory = useCallback(async () => {
    const supabase = createClient()
    const { sessions: next, entriesById: nextEntries } = await fetchMirrorHistory(supabase)
    setSessions(next)
    setEntriesByIdState(nextEntries)
  }, [])

  const returnToLanding = useCallback(() => {
    setView('landing')
    setCandidate(null)
    void refreshHistory()
    router.refresh()
  }, [router, refreshHistory])

  const handleOpen = async () => {
    if (opening) return
    setOpening(true)
    setOpenError(null)
    setView('loading')

    try {
      const [result] = await Promise.all([
        openMirrorCandidate(),
        new Promise<void>(resolve => setTimeout(resolve, MIRROR_LOADER_MIN_MS)),
      ])

      if (!result.ok) {
        setOpenError(result.message)
        setView('landing')
        return
      }

      if (!result.candidate) {
        setView('exhausted')
        return
      }

      setCandidate(result.candidate)
      setView('flow')
    } catch {
      setOpenError('Verbindung unterbrochen. Bitte erneut versuchen.')
      setView('landing')
    } finally {
      setOpening(false)
    }
  }

  if (view === 'loading') {
    return <MirrorNetworkLoader />
  }

  if (view === 'exhausted') {
    return (
      <div className="mx-auto w-full max-w-lg pb-28 pt-2">
        <div className="flex min-h-[50vh] flex-col justify-center gap-6 py-8">
          <p className="text-base leading-relaxed text-ink-2">{MIRROR_EXHAUSTED_TEXT}</p>
          <Button type="button" variant="ghost" size="lg" className="self-start" onClick={returnToLanding}>
            Schließen
          </Button>
        </div>
      </div>
    )
  }

  if (view === 'flow' && candidate) {
    return (
      <MirrorFlow
        candidate={candidate}
        skipInitialLoader
        onClose={returnToLanding}
      />
    )
  }

  return (
    <>
      <div className="mx-auto w-full max-w-lg pb-28 pt-2">
        <PageHeader
          title={<MirrorTitle />}
          description="Hier siehst du wiederkehrende Muster in deinen Einträgen — ohne Bewertung, nur als Spiegel dessen, was sich wiederholt."
          action={
            <button
              type="button"
              onClick={() => setRemindersOpen(true)}
              className="nav-interactive nav-interactive--ink flex size-[34px] items-center justify-center rounded-lg border border-edge"
              aria-label="Erinnerungen"
            >
              <Bell size={17} strokeWidth={1.75} />
            </button>
          }
        />

        <div className="mb-10">
          {openError && (
            <p role="alert" className="mb-4 text-sm text-err">
              {openError}
            </p>
          )}
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={opening}
            onClick={() => void handleOpen()}
          >
            <Eye size={18} strokeWidth={1.75} aria-hidden />
            Spiegel öffnen
          </Button>
        </div>

        <section>
          <h2 className="mb-4">Verlauf</h2>
          <MirrorHistoryToolbar
            filter={historyFilter}
            sort={historySort}
            onFilterChange={setHistoryFilter}
            onSortChange={setHistorySort}
            summary={(() => {
              const visible = applySortFilter(sessions, historySort, historyFilter)
              return visible.length === sessions.length
                ? `${sessions.length} Sitzung${sessions.length !== 1 ? 'en' : ''}`
                : `${visible.length} von ${sessions.length}`
            })()}
            openMenu={historyOpenMenu}
            onOpenMenu={setHistoryOpenMenu}
          />
          <MirrorHistory
            sessions={sessions}
            entriesById={entriesByIdState}
            sort={historySort}
            filter={historyFilter}
            onSessionsChange={setSessions}
          />
        </section>
      </div>

      {remindersOpen && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-14">
          <button
            type="button"
            className="absolute inset-0 bg-canvas/80 backdrop-blur-[2px]"
            aria-label="Schließen"
            onClick={() => setRemindersOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg">
            <RemindersPanel onClose={() => setRemindersOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
