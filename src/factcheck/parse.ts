import { factCheckResultSchema, type FactCheckResult } from './types.js'

const SAFE_FALLBACK: FactCheckResult = {
  verdict: 'no_evidence',
  caveat: 'Could not process the response — treated as unverified',
  explanation: 'The fact-check service returned an unexpected response. Please try again.',
  sources: [],
}

export function parseFactCheckResult(text: string): FactCheckResult {
  const stripped = text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return SAFE_FALLBACK

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0])
    const result = factCheckResultSchema.safeParse(parsed)
    if (!result.success) return SAFE_FALLBACK

    if (result.data.educatedGuess !== undefined && result.data.verdict !== 'no_evidence') {
      return {
        verdict: result.data.verdict,
        caveat: result.data.caveat,
        explanation: result.data.explanation,
        sources: result.data.sources,
      }
    }

    return result.data
  } catch {
    return SAFE_FALLBACK
  }
}
