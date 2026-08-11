import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResponseCountdown } from '../components/ui/ResponseCountdown'

// Mock i18n + lucide so the banner renders with deterministic text.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('lucide-react', () => ({
  Clock: () => <span data-testid="clock" />,
}))

describe('ResponseCountdown', () => {
  it('renders the expected-response label and a ticking timer for a future deadline', () => {
    const deadline = new Date(Date.now() + 2 * 3_600_000 + 5 * 60_000).toISOString()
    render(<ResponseCountdown deadline={deadline} />)
    expect(screen.getByText('rfq.expectedResponseIn')).toBeInTheDocument()
    // 2h05m — shows hours:minutes:seconds in tabular form
    expect(screen.getByText(/^02:0[45]:\d{2}$/)).toBeInTheDocument()
  })

  it('renders nothing when there is no deadline', () => {
    const { container } = render(<ResponseCountdown deadline={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the deadline has passed', () => {
    const deadline = new Date(Date.now() - 60_000).toISOString()
    const { container } = render(<ResponseCountdown deadline={deadline} />)
    expect(container).toBeEmptyDOMElement()
  })
})
