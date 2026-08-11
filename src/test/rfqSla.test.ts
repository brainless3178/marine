import { describe, it, expect } from 'vitest'
import { getRfqResponseDeadline, RFQ_RESPONSE_SLA_HOURS } from '../lib/rfqSla'

describe('getRfqResponseDeadline', () => {
  const submittedAt = Date.parse('2026-08-11T10:00:00Z')

  it('standard → 4 hours', () => {
    expect(getRfqResponseDeadline('standard', submittedAt)).toBe('2026-08-11T14:00:00.000Z')
  })

  it('urgent → 24 hours', () => {
    expect(getRfqResponseDeadline('urgent', submittedAt)).toBe('2026-08-12T10:00:00.000Z')
  })

  it('emergency → 2 hours', () => {
    expect(getRfqResponseDeadline('emergency', submittedAt)).toBe('2026-08-11T12:00:00.000Z')
  })

  it('unknown urgency falls back to the standard SLA', () => {
    expect(getRfqResponseDeadline('some-other', submittedAt)).toBe('2026-08-11T14:00:00.000Z')
  })

  it('SLA map contains all supported urgencies with positive hours', () => {
    for (const hours of Object.values(RFQ_RESPONSE_SLA_HOURS)) {
      expect(hours).toBeGreaterThan(0)
    }
    expect(Object.keys(RFQ_RESPONSE_SLA_HOURS)).toEqual(expect.arrayContaining(['standard', 'urgent', 'emergency']))
  })

  it('defaults to now when no timestamp is passed', () => {
    const before = Date.now()
    const deadline = Date.parse(getRfqResponseDeadline('standard'))
    const after = Date.now()
    expect(deadline).toBeGreaterThanOrEqual(before + 3_600_000 * 4)
    expect(deadline).toBeLessThanOrEqual(after + 3_600_000 * 4)
  })
})
