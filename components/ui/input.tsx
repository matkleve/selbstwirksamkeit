import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  trailing?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, trailing, className, ...props }, ref) => (
    <div
      className={cn(
        'field-shell',
        trailing ? 'relative' : undefined,
        error ? 'field-shell--error' : undefined,
        className,
      )}
    >
      <input
        ref={ref}
        className={cn('field-input px-4 py-3', trailing ? 'pr-11' : undefined)}
        {...props}
      />
      {trailing ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <div className="pointer-events-auto">{trailing}</div>
        </div>
      ) : null}
    </div>
  )
)
Input.displayName = 'Input'
