import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRef } from 'react'
import { Popover } from './Popover'

function TestHarness({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <div>
      <button ref={ref}>Anchor</button>
      <Popover open={open} onClose={onClose} anchorRef={ref}>
        <span>Popover content</span>
      </Popover>
    </div>
  )
}

describe('Popover', () => {
  it('renders nothing when closed', () => {
    render(<TestHarness open={false} onClose={() => {}} />)
    expect(screen.queryByText('Popover content')).toBeNull()
  })

  it('renders content when open', () => {
    render(<TestHarness open onClose={() => {}} />)
    expect(screen.getByText('Popover content')).toBeInTheDocument()
  })

  it('calls onClose when clicking outside', () => {
    const onClose = vi.fn()
    render(
      <div>
        <TestHarness open onClose={onClose} />
        <div data-testid="outside">outside</div>
      </div>,
    )
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not close when clicking inside the popover', () => {
    const onClose = vi.fn()
    render(<TestHarness open onClose={onClose} />)
    fireEvent.mouseDown(screen.getByText('Popover content'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close when clicking the anchor', () => {
    const onClose = vi.fn()
    render(<TestHarness open onClose={onClose} />)
    fireEvent.mouseDown(screen.getByText('Anchor'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on escape', () => {
    const onClose = vi.fn()
    render(<TestHarness open onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
