import { describe, it, expect } from 'vitest'
import xss from 'xss'

// ─── Sanitization options (mirrors middleware/sanitize.ts) ───
const xssOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return xss(value, xssOptions).trim()
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val)
    }
    return sanitized
  }
  return value
}

describe('XSS Sanitization', () => {
  it('should strip script tags', () => {
    const result = sanitizeValue('<script>alert("xss")</script>Hello') as string
    expect(result).not.toContain('<script>')
    expect(result).toContain('Hello')
  })

  it('should strip all HTML tags from strings', () => {
    const result = sanitizeValue('<img src=x onerror=alert(1)>Dangerous') as string
    expect(result).not.toContain('<img')
    expect(result).toContain('Dangerous')
  })

  it('should strip event handler attributes', () => {
    const result = sanitizeValue('<div onmouseover="alert(1)">Text</div>') as string
    expect(result).not.toContain('onmouseover')
  })

  it('should sanitize deeply nested objects', () => {
    const input = {
      name: '<b>Bold</b> Name',
      details: {
        description: '<script>alert("xss")</script>Safe text',
        tags: ['<img onerror=alert(1)>', 'normal-tag'],
      },
    }
    const result = sanitizeValue(input) as Record<string, unknown>
    expect(result.name).toBe('Bold Name')
    expect((result.details as Record<string, unknown>).description).not.toContain('<script>')
    expect(((result.details as Record<string, unknown>).tags as string[])[0]).not.toContain('<img')
    expect(((result.details as Record<string, unknown>).tags as string[])[1]).toBe('normal-tag')
  })

  it('should sanitize arrays of strings', () => {
    const result = sanitizeValue(['<script>alert(1)</script>', 'safe', '<img src=x onerror=alert(1)>']) as string[]
    expect(result[0]).not.toContain('<script>')
    expect(result[1]).toBe('safe')
    expect(result[2]).not.toContain('<img')
  })

  it('should leave numbers and booleans unchanged', () => {
    expect(sanitizeValue(42)).toBe(42)
    expect(sanitizeValue(true)).toBe(true)
    expect(sanitizeValue(null)).toBe(null)
  })

  it('should handle style tag injection', () => {
    const result = sanitizeValue('<style>body{background:red}</style>Safe') as string
    expect(result).not.toContain('<style>')
    expect(result).toContain('Safe')
  })

  it('should handle SVG-based XSS', () => {
    const result = sanitizeValue('<svg onload=alert(1)>') as string
    expect(result).not.toContain('onload')
    expect(result).not.toContain('<svg')
  })

  it('should trim whitespace after sanitization', () => {
    const result = sanitizeValue('  <script>x</script>  ') as string
    expect(result).toBe(result.trim())
  })
})
