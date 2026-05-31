import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-[18px] py-2 text-sm font-inherit cursor-pointer border transition-colors active:scale-[0.97] disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-fg border-transparent hover:opacity-90',
  ghost:
    'bg-transparent text-muted border-border hover:bg-border hover:text-foreground',
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
