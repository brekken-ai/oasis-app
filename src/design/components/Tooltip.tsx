// src/design/components/Tooltip.tsx
// Hover/focus tooltip rendered into a portal with configurable delay and placement.
// Consumed by: any component that needs contextual help text on hover.
// Depends on: design tokens (var(--popover), var(--popover-foreground), etc.) defined in src/design/tokens.css.
import {
  cloneElement,
  ReactElement,
  Ref,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { createPortal } from 'react-dom'
import styles from './Tooltip.module.css'

interface InjectedProps {
  ref?: Ref<HTMLElement>
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseLeave?: (e: React.MouseEvent) => void
  onFocus?: (e: React.FocusEvent) => void
  onBlur?: (e: React.FocusEvent) => void
}

export interface TooltipProps {
  content: string
  children: ReactElement<InjectedProps>
  delay?: number
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

interface Position {
  top: number
  left: number
}

export function Tooltip({
  content,
  children,
  delay = 500,
  placement = 'top',
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 })
  const anchorRef = useRef<HTMLElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const show = useCallback(() => {
    clearTimer()
    timerRef.current = setTimeout(() => {
      setVisible(true)
    }, delay)
  }, [delay, clearTimer])

  const hide = useCallback(() => {
    clearTimer()
    setVisible(false)
  }, [clearTimer])

  // Compute position when becoming visible
  useEffect(() => {
    if (!visible || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const gap = 6

    let top = 0
    let left = 0

    switch (placement) {
      case 'top':
        top = rect.top + window.scrollY - gap
        left = rect.left + window.scrollX + rect.width / 2
        break
      case 'bottom':
        top = rect.bottom + window.scrollY + gap
        left = rect.left + window.scrollX + rect.width / 2
        break
      case 'left':
        top = rect.top + window.scrollY + rect.height / 2
        left = rect.left + window.scrollX - gap
        break
      case 'right':
        top = rect.top + window.scrollY + rect.height / 2
        left = rect.right + window.scrollX + gap
        break
    }

    setPosition({ top, left })
  }, [visible, placement])

  // Cleanup on unmount
  useEffect(() => clearTimer, [clearTimer])

  const child = cloneElement(children, {
    ref: (el: HTMLElement | null) => {
      anchorRef.current = el
      // Forward the original ref if present
      const originalRef = (children as { ref?: React.Ref<unknown> }).ref
      if (typeof originalRef === 'function') originalRef(el)
      else if (originalRef && 'current' in originalRef) {
        ;(originalRef as React.MutableRefObject<HTMLElement | null>).current = el
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      show()
      children.props.onMouseEnter?.(e)
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hide()
      children.props.onMouseLeave?.(e)
    },
    onFocus: (e: React.FocusEvent) => {
      show()
      children.props.onFocus?.(e)
    },
    onBlur: (e: React.FocusEvent) => {
      hide()
      children.props.onBlur?.(e)
    },
  })

  const placementClass = styles[placement] ?? ''

  return (
    <>
      {child}
      {visible &&
        createPortal(
          <div
            role="tooltip"
            className={`${styles.tooltip} ${placementClass}`}
            style={{ top: position.top, left: position.left }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}

Tooltip.displayName = 'Tooltip'
