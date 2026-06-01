import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-field border bg-card text-ink placeholder:text-ink-3',
        'px-4 py-3 text-base resize-none',
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
Textarea.displayName = 'Textarea'
