import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies the primary variant by default', () => {
    render(<Button>Save</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toMatch(/primary/)
  })

  it('applies the secondary variant when specified', () => {
    render(<Button variant="secondary">Cancel</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toMatch(/secondary/)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
