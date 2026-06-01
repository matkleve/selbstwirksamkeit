import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'ghost' | 'link'
export type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const base =
  'inline-flex items-center justify-center gap-2 font-body font-medium rounded-field transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none shrink-0'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-ink-inv hover:opacity-85 active:scale-[0.97]',
  ghost:   'bg-transparent text-ink-2 border border-edge hover:border-ring hover:text-ink hover:bg-subtle active:scale-[0.97]',
  link:    'bg-transparent text-ink-2 hover:text-ink underline-offset-2 hover:underline p-0 h-auto',
}

const sizes: Record<ButtonSize, string> = {
  sm:  'h-8  px-3   text-sm',
  md:  'h-10 px-5   text-sm',
  lg:  'h-11 px-6   text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
)
Button.displayName = 'Button'
