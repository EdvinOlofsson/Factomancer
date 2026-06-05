import type { z } from 'zod'

/**
 * Extract every top-level balanced `{...}` object from the text, in document
 * order. String-aware so braces inside JSON string values don't break nesting.
 */
export function extractJsonCandidates(text: string): string[] {
  const candidates: string[] = []
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }

    if (ch === '"') {
      inString = true
    } else if (ch === '{') {
      if (depth === 0) start = i
      depth++
    } else if (ch === '}' && depth > 0) {
      depth--
      if (depth === 0 && start !== -1) {
        candidates.push(text.slice(start, i + 1))
        start = -1
      }
    }
  }

  return candidates
}

/**
 * Find the first JSON object in `text` that validates against `schema`.
 * Returns the parsed value, or null if none validate (caller decides fallback).
 */
export function parseModelJson<T>(text: string, schema: z.ZodType<T>): T | null {
  for (const candidate of extractJsonCandidates(text)) {
    try {
      const parsed: unknown = JSON.parse(candidate)
      const result = schema.safeParse(parsed)
      if (result.success) return result.data
    } catch {
      // not valid JSON — try the next candidate
    }
  }
  return null
}
