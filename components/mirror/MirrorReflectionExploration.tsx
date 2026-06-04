'use client'

import { ArrowLeftRight, Layers, Sparkles, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EntryDisplay } from '@/components/entry'
import { MirrorTimelineRow } from '@/components/mirror/MirrorFlow.timeline'
import type { ExplorationBlockReveal } from '@/components/mirror/MirrorFlow.useExplorationReveal'
import { MirrorRevealWords } from '@/components/mirror/MirrorRevealWords'
import { splitRevealWords } from '@/lib/mirrorReveal'
import type {
  MirrorExplorationBlock,
  MirrorExplorationKind,
  MirrorExplorationOffers,
} from '@/lib/mirrorExploration'

const EXPLORATION_ACTIONS: Record<
  MirrorExplorationKind,
  { label: string; Icon: LucideIcon }
> = {
  more: { label: 'Mehr Beispiele', Icon: Layers },
  positive: { label: 'Positive Momente', Icon: Sparkles },
  contrast: { label: 'Anders war\'s', Icon: ArrowLeftRight },
}

const KIND_ORDER: MirrorExplorationKind[] = ['more', 'positive', 'contrast']

function ExplorationActionButtons({
  kinds,
  onExplore,
}: {
  kinds: MirrorExplorationKind[]
  onExplore: (kind: MirrorExplorationKind) => void
}) {
  if (!kinds.length) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {kinds.map(kind => {
        const { label, Icon } = EXPLORATION_ACTIONS[kind]
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onExplore(kind)}
            className="cursor-pointer rounded-chip border-0 bg-transparent p-0"
          >
            <Badge variant="default" className="gap-1.5 py-1.5">
              <Icon size={14} strokeWidth={1.75} aria-hidden />
              {label}
            </Badge>
          </button>
        )
      })}
    </div>
  )
}

interface Props {
  offers: MirrorExplorationOffers
  usedKinds: ReadonlySet<MirrorExplorationKind>
  blocks: MirrorExplorationBlock[]
  revealByBlock: Record<string, ExplorationBlockReveal>
  relevantMeta?: string[]
  markerBaseIdx: number
  onExplore: (kind: MirrorExplorationKind) => void
}

export function MirrorReflectionExploration({
  offers,
  usedKinds,
  blocks,
  revealByBlock,
  relevantMeta,
  markerBaseIdx,
  onExplore,
}: Props) {
  const available = KIND_ORDER.filter(k => offers[k] && !usedKinds.has(k))

  if (!available.length && !blocks.length) return null

  let markerIdx = markerBaseIdx

  return (
    <div className="mb-6 flex flex-col gap-5">
      {blocks.map(block => {
        const reveal = revealByBlock[block.id]
        const introWords = splitRevealWords(block.intro)
        const introVisible = reveal?.introWords ?? 0
        const visibleEntries = block.entries.slice(0, reveal?.visibleEntryCount ?? 0)

        return (
          <div key={block.id} className="flex flex-col gap-4">
            <MirrorTimelineRow markerType="text" markerIdx={markerIdx++}>
              <MirrorRevealWords
                as="p"
                words={introWords}
                visibleCount={introVisible}
                showCursor={introVisible < introWords.length}
                className="font-display text-base italic leading-snug text-ink-2"
              />
            </MirrorTimelineRow>

            {visibleEntries.map(entry => {
              const er = reveal?.entries[entry.id]
              return (
                <MirrorTimelineRow key={entry.id} markerType="entry" markerIdx={markerIdx++}>
                  <EntryDisplay
                    entry={entry}
                    variant="chips-closed"
                    header="mirror"
                    size="sm"
                    lines={2}
                    menu={false}
                    card
                    relevantMeta={relevantMeta}
                    reveal={{
                      headerWordCount: er?.headerWords ?? 0,
                      bodyWordCount: er?.bodyWords ?? 0,
                      chipCount: er?.chipCount ?? 0,
                    }}
                  />
                </MirrorTimelineRow>
              )
            })}
          </div>
        )
      })}

      {available.length > 0 && (
        <MirrorTimelineRow markerType="reflection" markerIdx={markerIdx}>
          <ExplorationActionButtons kinds={available} onExplore={onExplore} />
        </MirrorTimelineRow>
      )}
    </div>
  )
}
