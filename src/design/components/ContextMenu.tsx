// src/design/components/ContextMenu.tsx
// Right-click context menu with keyboard nav and submenus. Renders to portal.
// Consumed by: editor right-click (Week 2), file tree right-click (Week 3).
// Depends on: design tokens, ChevronRight icon for submenu indicators.
import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight } from './icons'
import styles from './ContextMenu.module.css'
import type { LucideIcon } from 'lucide-react'

export type ContextMenuItem =
  | { type: 'item'; label: string; icon?: LucideIcon; shortcut?: string; onSelect: () => void; disabled?: boolean }
  | { type: 'separator' }
  | { type: 'submenu'; label: string; icon?: LucideIcon; items: ContextMenuItem[] }

export interface ContextMenuProps {
  open: boolean
  onClose: () => void
  x: number
  y: number
  items: ContextMenuItem[]
}

// Helper: find next focusable index given a starting point and direction
function findNext(items: ContextMenuItem[], from: number, dir: 1 | -1): number {
  const len = items.length
  let i = from
  for (let step = 0; step < len; step++) {
    i = (i + dir + len) % len
    const item = items[i]
    if (item.type === 'separator') continue
    if (item.type === 'item' && item.disabled) continue
    return i
  }
  return from
}

export function ContextMenu(props: ContextMenuProps) {
  const { open, onClose, x, y, items } = props
  const menuRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [submenuIndex, setSubmenuIndex] = useState<number | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: y, left: x })

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setActiveIndex(-1)
      setSubmenuIndex(null)
      setPos({ top: y, left: x })
    }
  }, [open, x, y])

  // Adjust position if overflowing viewport (after mount)
  useEffect(() => {
    if (!open || !menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let { top, left } = pos
    if (left + rect.width > vw) left = Math.max(0, vw - rect.width - 4)
    if (top + rect.height > vh) top = Math.max(0, vh - rect.height - 4)
    if (top !== pos.top || left !== pos.left) setPos({ top, left })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Keyboard
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => findNext(items, i === -1 ? -1 : i, 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => findNext(items, i === -1 ? items.length : i, -1))
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        const item = items[activeIndex]
        if (item.type === 'item' && !item.disabled) {
          e.preventDefault()
          item.onSelect()
          onClose()
        } else if (item.type === 'submenu') {
          e.preventDefault()
          setSubmenuIndex(activeIndex)
        }
      } else if (e.key === 'ArrowRight' && activeIndex >= 0) {
        const item = items[activeIndex]
        if (item.type === 'submenu') {
          e.preventDefault()
          setSubmenuIndex(activeIndex)
        }
      } else if (e.key === 'ArrowLeft' && submenuIndex !== null) {
        e.preventDefault()
        setSubmenuIndex(null)
      }
    },
    [open, items, activeIndex, submenuIndex, onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, handleKey])

  // Outside click closes (root only — submenus handle their own region)
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open, onClose])

  if (!open) return null

  // Find the rect of an item for positioning its submenu
  const submenuAnchor =
    submenuIndex !== null
      ? (menuRef.current?.children[submenuIndex] as HTMLElement | undefined)
      : undefined

  return createPortal(
    <>
      <div
        ref={menuRef}
        className={styles.menu}
        style={{ top: pos.top, left: pos.left }}
        role="menu"
      >
        {items.map((item, i) => {
          if (item.type === 'separator') {
            return <div key={i} role="separator" className={styles.separator} />
          }
          if (item.type === 'submenu') {
            const isActive = activeIndex === i
            const Icon = item.icon
            return (
              <div
                key={i}
                role="menuitem"
                aria-haspopup="menu"
                aria-expanded={submenuIndex === i}
                className={`${styles.item} ${isActive ? styles.active : ''}`}
                onMouseEnter={() => {
                  setActiveIndex(i)
                  setSubmenuIndex(i)
                }}
              >
                {Icon && <Icon size={14} className={styles.icon} strokeWidth={1.75} />}
                <span className={styles.label}>{item.label}</span>
                <ChevronRight size={14} className={styles.chevron} />
              </div>
            )
          }
          const isActive = activeIndex === i
          const Icon = item.icon
          return (
            <div
              key={i}
              role="menuitem"
              aria-disabled={item.disabled}
              className={`${styles.item} ${isActive ? styles.active : ''} ${item.disabled ? styles.disabled : ''}`}
              onMouseEnter={() => {
                if (!item.disabled) setActiveIndex(i)
              }}
              onMouseLeave={() => {
                if (submenuIndex === null) setActiveIndex(-1)
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                if (!item.disabled) {
                  item.onSelect()
                  onClose()
                }
              }}
            >
              {Icon && <Icon size={14} className={styles.icon} strokeWidth={1.75} />}
              <span className={styles.label}>{item.label}</span>
              {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
            </div>
          )
        })}
      </div>
      {/* Submenu rendered as its own ContextMenu, positioned to the right of the active item */}
      {submenuIndex !== null &&
        items[submenuIndex].type === 'submenu' &&
        submenuAnchor && (
          <ContextMenu
            open
            onClose={onClose}
            x={submenuAnchor.getBoundingClientRect().right - 2}
            y={submenuAnchor.getBoundingClientRect().top}
            items={(items[submenuIndex] as { type: 'submenu'; items: ContextMenuItem[] }).items}
          />
        )}
    </>,
    document.body,
  )
}

ContextMenu.displayName = 'ContextMenu'
