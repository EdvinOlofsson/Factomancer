import { factCheckResultSchema, type FactCheckResult } from './types.js'

const SAFE_FALLBACK: FactCheckResult = {
  verdict: 'no_evidence',
  caveat: 'Could not process the response — treated as unverified',
  explanation: 'The fact-check service returned an unexpected response. Please try again.',
  sources: [],
}

/**
 * Extract every top-level balanced `{...}` object from the text, in document
 * order. String-aware so braces inside JSON string values don't break nesting.
 */
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

function stripUnverifiedGuess(data: FactCheckResult): FactCheckResult {
  if (data.educatedGuess !== undefined && data.verdict !== 'no_evidence') {
    return {
      verdict: data.verdict,
      caveat: data.caveat,
      explanation: data.explanation,
      sources: data.sources,
    }
  }
  return data
}

export function parseFactCheckResult(text: string): FactCheckResult {
  for (const candidate of extractJsonCandidates(text)) {
    try {
      const parsed: unknown = JSON.parse(candidate)
      const result = factCheckResultSchema.safeParse(parsed)
      if (result.success) return stripUnverifiedGuess(result.data)
    } catch {
      // not valid JSON — try the next candidate
    }
  }
  return SAFE_FALLBACK
}
