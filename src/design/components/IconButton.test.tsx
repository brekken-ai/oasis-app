import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { X, Search } from './icons'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('renders the icon and accessible label', () => {
    render(<IconButton icon={X} label="Close" />)
    const btn = screen.getByRole('button', { name: 'Close' })
    expect(btn).toBeInTheDocument()
    expect(btn.querySelector('svg')).toBeInTheDocument()
  })

  it('uses sm size when specified', () => {
    render(<IconButton icon={Search} label="Search" size="sm" />)
    expect(screen.getByRole('button').className).toMatch(/sm/)
  })

  it('applies ghost variant by default', () => {
    render(<IconButton icon={X} label="Close" />)
    expect(screen.getByRole('button').className).toMatch(/ghost/)
  })

  it('forwards button props', () => {
    const onClick = () => {}
    render(<IconButton icon={X} label="Close" onClick={onClick} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
