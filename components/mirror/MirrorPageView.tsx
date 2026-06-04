'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { RemindersPanel } from '@/components/RemindersPanel'
import MirrorFlow from '@/components/MirrorFlow'
import { MirrorNetworkLoader } from '@/components/mirror/MirrorNetworkLoader'
import { MirrorHistory } from '@/components/mirror/MirrorHistory'
import { Button } from '@/components/ui/button'
import {
  MIRROR_EXHAUSTED_TEXT,
  MIRROR_LOADER_MIN_MS,
} from '@/components/mirror/MirrorFlow.constants'
import { openMirrorCandidate } from '@/lib/mirror-actions'
import type { MirrorSessionRow } from '@/lib/mirror-session'
import type { MirrorCandidate } from '@/lib/patternDetection'
import type { Entry } from '@/lib/types'

type View = 'landing' | 'loading' | 'flow' | 'exhausted'

interface Props {
  initialSessions: MirrorSessionRow[]
  entriesById: Record<string, Entry>
}

export function MirrorPageView({ initialSessions, entriesById }: Props) {
  const router = useRouter()
  const [view, setView] = useState<View>('landing')
  const [candidate, setCandidate] = useState<MirrorCandidate | null>(null)
  const [sessions, setSessions] = useState(initialSessions)
  const [opening, setOpening] = useState(false)
  const [remindersOpen, setRemindersOpen] = useState(false)

  const returnToLanding = useCallback(() => {
    setView('landing')
    setCandidate(null)
    router.refresh()
  }, [router])

  const handleOpen = async () => {
    if (opening) return
    setOpening(true)
    setView('loading')

    const [next] = await Promise.all([
      openMirrorCandidate(),
      new Promise<void>(resolve => setTimeout(resolve, MIRROR_LOADER_MIN_MS)),
    ])

    if (!next) {
      setView('exhausted')
      setOpening(false)
      return
    }

    setCandidate(next)
    setView('flow')
    setOpening(false)
  }

  if (view === 'loading') {
    return <MirrorNetworkLoader />
  }

  if (view === 'exhausted') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-base leading-relaxed text-ink-2">{MIRROR_EXHAUSTED_TEXT}</p>
        <Button type="button" variant="ghost" size="lg" onClick={returnToLanding}>
          Schließen
        </Button>
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
      <div className="w-full pb-28 pt-2">
        <PageHeader
          title="Spiegel"
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
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={opening}
            onClick={() => void handleOpen()}
          >
            Spiegel öffnen
          </Button>
        </div>

        <section>
          <h2 className="mb-4">Verlauf</h2>
          <MirrorHistory
            sessions={sessions}
            entriesById={entriesById}
            onSessionsChange={setSessions}
          />
        </section>
      </div>

      {remindersOpen && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-14">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--background)]/80 backdrop-blur-[2px]"
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
