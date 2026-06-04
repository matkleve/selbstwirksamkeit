import { Eye } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Props {
  className?: string
}

export function MirrorTitle({ className }: Props) {
  return (
    <h1
      className={cn(
        'inline-flex items-center gap-2.5 font-display text-[1.75rem] font-normal italic leading-tight text-ink',
        className,
      )}
    >
      <Eye size={22} strokeWidth={1.75} className="shrink-0 text-ink-2" aria-hidden />
      Spiegel
    </h1>
  )
}
