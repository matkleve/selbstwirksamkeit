'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

const pillBase =
  'inline-flex items-center justify-center gap-1 rounded-chip border border-edge px-3 py-1.5 text-sm leading-none text-ink-2 transition-colors hover:bg-subtle hover:text-ink disabled:pointer-events-none disabled:opacity-50'

export const PillButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(pillBase, className)} {...props} />
  ),
)
PillButton.displayName = 'PillButton'

const CONFIRM_RESET_MS = 5000

type ConfirmAlign = 'left' | 'center' | 'right'

export interface ConfirmPillButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'> {
  icon: ReactNode
  confirmLabel: string
  onConfirm: () => void
  resetMs?: number
  /** Expansion direction when armed — `right` grows leftward (icon stays on the right). */
  align?: ConfirmAlign
  idleAriaLabel?: string
}

export function ConfirmPillButton({
  icon,
  confirmLabel,
  onConfirm,
  resetMs = CONFIRM_RESET_MS,
  align = 'right',
  idleAriaLabel = 'Schließen',
  className,
  type = 'button',
  ...props
}: ConfirmPillButtonProps) {
  const [armed, setArmed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const disarm = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setArmed(false)
  }, [])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const arm = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setArmed(true)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setArmed(false)
    }, resetMs)
  }, [resetMs])

  const handleClick = () => {
    if (!armed) {
      arm()
      return
    }
    disarm()
    onConfirm()
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      aria-label={armed ? `${confirmLabel} bestätigen` : idleAriaLabel}
      className={cn(
        'nav-interactive nav-interactive--ink flex shrink-0 items-center overflow-hidden border border-edge bg-canvas',
        'transition-[width,padding,border-radius,gap] duration-200 ease-out',
        armed ? 'gap-2 rounded-chip py-1.5 pl-3 pr-2' : 'size-[34px] justify-center rounded-full',
        align === 'right' && 'ml-auto',
        align === 'center' && 'mx-auto',
        className,
      )}
      {...props}
    >
      {armed && (
        <span className="mirror-fade-in whitespace-nowrap text-sm">
          {confirmLabel}
        </span>
      )}
      <span className="flex shrink-0 items-center justify-center">{icon}</span>
    </button>
  )
}
