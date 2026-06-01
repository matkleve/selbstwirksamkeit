import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-field border bg-card text-ink placeholder:text-ink-3',
        'px-4 py-3 text-base leading-none',
        'transition-all duration-150 outline-none',
        error
          ? 'border-err focus:border-err focus:ring-2 focus:ring-err/20'
          : 'border-edge focus:border-ring focus:ring-2 focus:ring-ring/15',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
