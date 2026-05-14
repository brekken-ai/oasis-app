import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders nothing when open is false', () => {
    render(<Modal open={false} onClose={() => {}}>Hi</Modal>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders children when open', () => {
    render(<Modal open onClose={() => {}}>Modal body</Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Modal body')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<Modal open onClose={() => {}} title="Settings">body</Modal>)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('calls onClose when escape pressed', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose}>body</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose}>body</Modal>)
    // backdrop has role neither but is the parent of dialog
    const dialog = screen.getByRole('dialog')
    const backdrop = dialog.parentElement!
    fireEvent.mouseDown(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onClose when dialog itself clicked', () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose}>body</Modal>)
    fireEvent.mouseDown(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('locks body scroll while open and restores after', () => {
    const { rerender } = render(<Modal open onClose={() => {}}>body</Modal>)
    expect(document.body.style.overflow).toBe('hidden')
    rerender(<Modal open={false} onClose={() => {}}>body</Modal>)
    expect(document.body.style.overflow).toBe('')
  })
})
