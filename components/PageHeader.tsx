import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: Props) {
  return (
    <header
      className={cn(
        'mb-8',
        action && 'flex items-start justify-between gap-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
    </header>
  )
}
