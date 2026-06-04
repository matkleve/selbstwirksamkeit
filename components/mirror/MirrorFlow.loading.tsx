'use client'

import { cn } from '@/lib/cn'
import { MIRROR_LOADING_STEPS } from '@/components/mirror/MirrorFlow.constants'

export function MirrorFlowLoading({ loadingStep }: { loadingStep: number }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-11 bg-[var(--background)] text-[var(--foreground)]"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="flex size-14 items-center justify-center rounded-full border border-edge bg-card text-2xl"
        aria-hidden
      >
        🪞
      </div>

      <div className="flex min-w-[13.125rem] flex-col gap-2">
        {MIRROR_LOADING_STEPS.map((step, i) =>
          loadingStep >= i ? (
            <div
              key={i}
              className={cn(
                'mirror-fade-in flex items-center gap-2.5 text-[0.8125rem] tracking-wide',
                loadingStep === i ? 'text-ink' : 'text-ink-3',
              )}
            >
              <span className="w-3 text-[0.5625rem] opacity-70" aria-hidden>
                {loadingStep > i ? '✓' : '·'}
              </span>
              {step}
            </div>
          ) : null,
        )}
      </div>

      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="mirror-dot-pulse size-1 rounded-full bg-ink-3"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
