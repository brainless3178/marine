import { describe, it, expect, vi, afterEach } from 'vitest'
import { useState } from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { TickerProvider, useTickerNow } from '../components/TickerProvider'

function Probe({ label, active = true }: { label: string; active?: boolean }) {
  const now = useTickerNow(active)
  return <div data-testid={label}>{now}</div>
}

/** Provider stays mounted; a button toggles the consumer in/out. */
function ToggleHost() {
  const [show, setShow] = useState(true)
  return (
    <TickerProvider>
      {show && <Probe label="a" />}
      <button onClick={() => setShow((v) => !v)}>toggle</button>
    </TickerProvider>
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('TickerProvider — shared single interval', () => {
  it('advances all active consumers with one interval', () => {
    vi.useFakeTimers()
    const initialNow = Date.now()
    vi.setSystemTime(initialNow)

    render(
      <TickerProvider>
        <Probe label="a" />
        <Probe label="b" />
        <Probe label="c" />
      </TickerProvider>
    )

    expect(screen.getByTestId('a').textContent).toBe(String(initialNow))
    expect(screen.getByTestId('b').textContent).toBe(String(initialNow))
    expect(screen.getByTestId('c').textContent).toBe(String(initialNow))

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // All three consumers see the same advanced timestamp
    const expected = initialNow + 2000
    expect(screen.getByTestId('a').textContent).toBe(String(expected))
    expect(screen.getByTestId('b').textContent).toBe(String(expected))
    expect(screen.getByTestId('c').textContent).toBe(String(expected))
  })

  it('runs a single interval regardless of consumer count', () => {
    vi.useFakeTimers()
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')

    render(
      <TickerProvider>
        <Probe label="a" />
        <Probe label="b" />
        <Probe label="c" />
        <Probe label="d" />
      </TickerProvider>
    )

    // Only the ticker's own 1s interval is mounted — one per provider, not per consumer
    const tickerIntervals = setIntervalSpy.mock.calls.filter((args) => args[1] === 1000)
    expect(tickerIntervals.length).toBe(1)
    setIntervalSpy.mockRestore()
  })

  it('does not start the interval when no consumer is active', () => {
    vi.useFakeTimers()
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')

    render(
      <TickerProvider>
        <Probe label="inactive" active={false} />
      </TickerProvider>
    )

    const tickerIntervals = setIntervalSpy.mock.calls.filter((args) => args[1] === 1000)
    expect(tickerIntervals.length).toBe(0)
    setIntervalSpy.mockRestore()
  })

  it('stops the interval when the last active consumer unmounts (provider stays mounted)', () => {
    vi.useFakeTimers()
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

    render(<ToggleHost />)
    clearIntervalSpy.mockClear()

    // Unmount only the consumer — the provider remains mounted
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    act(() => {
      fireEvent.click(screen.getByText('toggle'))
    })

    // The provider's cleanup of the consumer's unsubscribe cleared the interval
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
