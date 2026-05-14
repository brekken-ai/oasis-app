// src/design/components/Popover.tsx
// Anchor-positioned floating panel. Outside-click and Escape close. Renders to portal.
// Consumed by: context menus, dropdowns, inline action panels throughout the app.
// Depends on: design tokens (var(--popover), var(--popover-foreground), etc.) defined in src/design/tokens.css.
import { ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Popover.module.css'

export type PopoverPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'right-start'

export interface PopoverProps {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  placement?: PopoverPlacement
  children: ReactNode
}

export function Popover({ open, onClose, anchorRef, placement = 'bottom-start', children }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // Compute position
  useEffect(() => {
    if (!open || !anchorRef.current) return
    const compute = () => {
      const rect = anchorRef.current!.getBoundingClientRect()
      const popH = popoverRef.current?.offsetHeight ?? 0
      const popW = popoverRef.current?.offsetWidth ?? 0
      const gap = 4
      let top = 0
      let left = 0
      switch (placement) {
        case 'bottom-start': top = rect.bottom + gap; left = rect.left; break
        case 'bottom-end':   top = rect.bottom + gap; left = rect.right - popW; break
        case 'top-start':    top = rect.top - popH - gap; left = rect.left; break
        case 'top-end':      top = rect.top - popH - gap; left = rect.right - popW; break
        case 'right-start':  top = rect.top; left = rect.right + gap; break
      }
      setPos({ top, left })
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [open, anchorRef, placement])

  // Outside click + escape
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (popoverRef.current?.contains(target)) return
      if (anchorRef.current?.contains(target)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, anchorRef, onClose])

  if (!open) return null

  return createPortal(
    <div
      ref={popoverRef}
      className={styles.popover}
      style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden' }}
      role="dialog"
    >
      {children}
    </div>,
    document.body,
  )
}

Popover.displayName = 'Popover'
