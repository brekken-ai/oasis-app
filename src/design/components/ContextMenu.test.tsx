import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Bold, Italic, FileText } from './icons'
import { ContextMenu, ContextMenuItem } from './ContextMenu'

const items: ContextMenuItem[] = [
  { type: 'item', label: 'Bold', icon: Bold, onSelect: vi.fn(), shortcut: '⌘B' },
  { type: 'item', label: 'Italic', icon: Italic, onSelect: vi.fn() },
  { type: 'separator' },
  { type: 'submenu', label: 'Insert', icon: FileText, items: [
    { type: 'item', label: 'Link', onSelect: vi.fn() },
  ]},
  { type: 'item', label: 'Disabled item', onSelect: vi.fn(), disabled: true },
]

describe('ContextMenu', () => {
  it('renders nothing when closed', () => {
    render(<ContextMenu open={false} onClose={() => {}} x={0} y={0} items={items} />)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('renders items when open', () => {
    render(<ContextMenu open onClose={() => {}} x={10} y={10} items={items} />)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('Bold')).toBeInTheDocument()
    expect(screen.getByText('Italic')).toBeInTheDocument()
  })

  it('renders separator', () => {
    render(<ContextMenu open onClose={() => {}} x={0} y={0} items={items} />)
    expect(screen.getAllByRole('separator')).toHaveLength(1)
  })

  it('shows submenu indicator for submenu items', () => {
    render(<ContextMenu open onClose={() => {}} x={0} y={0} items={items} />)
    const submenuItem = screen.getByText('Insert').closest('[role="menuitem"]')!
    expect(submenuItem.getAttribute('aria-haspopup')).toBe('menu')
  })

  it('invokes onSelect on mousedown of item and closes', () => {
    const onClose = vi.fn()
    const onSelect = vi.fn()
    const testItems: ContextMenuItem[] = [{ type: 'item', label: 'Bold', onSelect }]
    render(<ContextMenu open onClose={onClose} x={0} y={0} items={testItems} />)
    fireEvent.mouseDown(screen.getByText('Bold').closest('[role="menuitem"]')!)
    expect(onSelect).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not invoke onSelect for disabled items', () => {
    const onSelect = vi.fn()
    const testItems: ContextMenuItem[] = [{ type: 'item', label: 'Foo', onSelect, disabled: true }]
    render(<ContextMenu open onClose={() => {}} x={0} y={0} items={testItems} />)
    fireEvent.mouseDown(screen.getByText('Foo').closest('[role="menuitem"]')!)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('closes on escape', () => {
    const onClose = vi.fn()
    render(<ContextMenu open onClose={onClose} x={0} y={0} items={items} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('moves active item with ArrowDown', () => {
    render(<ContextMenu open onClose={() => {}} x={0} y={0} items={items} />)
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    const bold = screen.getByText('Bold').closest('[role="menuitem"]')!
    expect(bold.className).toMatch(/active/)
  })

  it('skips separators and disabled items with ArrowDown', () => {
    // Items: Bold(0), Italic(1), separator(2), Insert/submenu(3), Disabled(4)
    // Down from -1 → Bold(0), Down → Italic(1), Down skips sep(2) → Insert(3)
    render(<ContextMenu open onClose={() => {}} x={0} y={0} items={items} />)
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    const insert = screen.getByText('Insert').closest('[role="menuitem"]')!
    expect(insert.className).toMatch(/active/)
  })

  it('closes on outside mousedown', () => {
    const onClose = vi.fn()
    render(
      <div>
        <ContextMenu open onClose={onClose} x={0} y={0} items={items} />
        <div data-testid="outside">outside</div>
      </div>,
    )
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows shortcut hint for items with a shortcut', () => {
    render(<ContextMenu open onClose={() => {}} x={0} y={0} items={items} />)
    expect(screen.getByText('⌘B')).toBeInTheDocument()
  })
})
