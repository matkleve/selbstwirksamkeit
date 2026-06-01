import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

type BadgeVariant = 'default' | 'filled'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-chip px-3 py-1 text-sm leading-none transition-all duration-150',
        variant === 'default'
          ? 'border border-edge text-ink-2 bg-transparent'
          : 'bg-ink text-ink-inv border-transparent',
        className
      )}
      {...props}
    />
  )
)
Badge.displayName = 'Badge'
