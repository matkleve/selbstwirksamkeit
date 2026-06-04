import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => (
    <div
      className={cn(
        'field-shell',
        error ? 'field-shell--error' : undefined,
        className,
      )}
    >
      <textarea
        ref={ref}
        className="field-input field-input--textarea px-4 py-3"
        {...props}
      />
    </div>
  )
)
Textarea.displayName = 'Textarea'
