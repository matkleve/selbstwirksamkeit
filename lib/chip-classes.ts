import { cn } from '@/lib/cn'

/** Shared chip geometry: 27px = 2×border + 15px icon + 2×5px padding */
export const chipBase = cn(
  'inline-flex h-[27px] max-h-[27px] min-h-[27px] box-border items-center gap-1.5',
  'rounded-full border border-edge px-2.5 py-0',
  'text-[0.8125rem] leading-none font-[inherit]',
)

export const chipGhost = cn(
  chipBase,
  'cursor-pointer bg-subtle text-ink-2',
)

export const chipField = cn(
  chipBase,
  'w-40 cursor-text bg-card text-ink placeholder:text-ink-3',
  'focus:outline-none focus:border-ring',
  'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/15',
)

export const chipFilled = cn(
  chipBase,
  'cursor-pointer border-transparent bg-ink text-ink-inv',
)
