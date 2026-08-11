/**
 * Response SLA (in hours) per RFQ urgency level.
 * Used to build the live "expected response in" countdown shown after a
 * request is submitted. Driven by the app-wide shared ticker so the banner
 * doesn't need its own interval.
 */
export const RFQ_RESPONSE_SLA_HOURS: Record<string, number> = {
  standard: 4, // "We Respond in 4 Hours."
  urgent: 24, // Urgent (24-48 hours) — earliest bound
  emergency: 2, // "Respond within 2 hours" (emergency email template)
}

/**
 * Deadline (ISO string) by which the team commits to respond for a given
 * urgency. Unknown urgencies fall back to the standard SLA.
 */
export function getRfqResponseDeadline(urgency: string, submittedAt: number = Date.now()): string {
  const hours = RFQ_RESPONSE_SLA_HOURS[urgency] ?? RFQ_RESPONSE_SLA_HOURS.standard
  return new Date(submittedAt + hours * 3_600_000).toISOString()
}
