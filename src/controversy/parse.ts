import { controversyResultSchema, type ControversyResult } from './types.js'

const SAFE_FALLBACK: ControversyResult = {
  score: 1,
  summary: 'The controversy check service returned an unexpected response. Please try again.',
  courtCases: [],
  countryBans: [],
  platformBans: [],
  majorCritique: [],
  sources: [],
}

function extractJsonCandidates(text: string): string[] {
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

export function parseControversyResult(text: string): ControversyResult {
  for (const candidate of extractJsonCandidates(text)) {
    try {
      const parsed: unknown = JSON.parse(candidate)
      const result = controversyResultSchema.safeParse(parsed)
      if (result.success) return result.data
    } catch {
      // not valid JSON — try next candidate
    }
  }
  return SAFE_FALLBACK
}
