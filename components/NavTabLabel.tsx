import { cn } from '@/lib/cn'

interface Props {
  label: string
  active: boolean
}

/** Reserves semibold width so tab bar does not shift when active state toggles. */
export function NavTabLabel({ label, active }: Props) {
  return (
    <span className="inline-grid text-center text-[0.5625rem] uppercase tracking-wide">
      <span aria-hidden className="invisible col-start-1 row-start-1 font-semibold">
        {label}
      </span>
      <span className={cn('col-start-1 row-start-1', active ? 'font-semibold' : 'font-normal')}>
        {label}
      </span>
    </span>
  )
}
