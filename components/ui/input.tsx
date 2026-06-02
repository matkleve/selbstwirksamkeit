import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => (
    <div
      className={cn(
        'field-shell',
        error && 'field-shell--error',
        className,
      )}
    >
      <input
        ref={ref}
        className="field-input px-4 py-3"
        {...props}
      />
    </div>
  )
)
Input.displayName = 'Input'
