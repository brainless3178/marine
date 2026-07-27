import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('renders as button element by default', () => {
    render(<Button>Button</Button>)
    expect(screen.getByRole('button', { name: /button/i })).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-[var(--accent-primary)]')
  })

  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-transparent')
  })

  it('applies danger variant', () => {
    render(<Button variant="danger">Danger</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-danger')
  })

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-transparent')
  })

  it('applies small size', () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('text-xs')
  })

  it('applies medium size', () => {
    render(<Button size="md">Medium</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('text-sm')
  })

  it('applies large size', () => {
    render(<Button size="lg">Large</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('text-base')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders icon when provided', () => {
    const icon = <span data-testid="btn-icon">★</span>
    render(<Button icon={icon}>With Icon</Button>)
    expect(screen.getByTestId('btn-icon')).toBeInTheDocument()
  })

  it('renders as anchor when href is provided', () => {
    render(<Button href="/test">Link Button</Button>)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test')
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('applies shimmer class when shimmer is true', () => {
    render(<Button shimmer>Shimmer</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('shimmer-btn')
  })

  it('accepts custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('custom-class')
  })
})

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card Content</Card>)
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('applies hover class by default', () => {
    render(<Card>Hoverable</Card>)
    const card = screen.getByText('Hoverable').closest('div')
    expect(card).toHaveClass('hover:-translate-y-1')
  })

  it('disables hover when hover is false', () => {
    render(<Card hover={false}>No Hover</Card>)
    const card = screen.getByText('No Hover').closest('div')
    expect(card).not.toHaveClass('hover:-translate-y-1')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Card onClick={handleClick}>Clickable</Card>)
    
    screen.getByText('Clickable').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(<Card className="my-custom">Custom</Card>)
    const card = screen.getByText('Custom').closest('div')
    expect(card).toHaveClass('my-custom')
  })

  it('applies base styles', () => {
    render(<Card>Styled</Card>)
    const card = screen.getByText('Styled').closest('div')
    expect(card).toHaveClass('border')
    expect(card).toHaveClass('p-6')
    expect(card).toHaveClass('transition-all')
  })
})
