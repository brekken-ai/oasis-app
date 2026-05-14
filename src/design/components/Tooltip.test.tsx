import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('does not show tooltip initially', () => {
    render(
      <Tooltip content="Helpful text">
        <button>Hover me</button>
      </Tooltip>,
    )
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('shows tooltip after delay on hover', () => {
    render(
      <Tooltip content="Helpful text" delay={300}>
        <button>Hover me</button>
      </Tooltip>,
    )
    fireEvent.mouseEnter(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).toBeNull()
    act(() => { vi.advanceTimersByTime(300) })
    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful text')
  })

  it('hides tooltip on mouse leave', () => {
    render(
      <Tooltip content="Helpful text" delay={100}>
        <button>Hover me</button>
      </Tooltip>,
    )
    const btn = screen.getByRole('button')
    fireEvent.mouseEnter(btn)
    act(() => { vi.advanceTimersByTime(100) })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.mouseLeave(btn)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('cancels timeout if mouse leaves before delay', () => {
    render(
      <Tooltip content="Helpful text" delay={500}>
        <button>Hover me</button>
      </Tooltip>,
    )
    const btn = screen.getByRole('button')
    fireEvent.mouseEnter(btn)
    act(() => { vi.advanceTimersByTime(200) })
    fireEvent.mouseLeave(btn)
    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
