import { parseModelJson } from '../lib/json-extract.js'
import { factCheckResultSchema, type FactCheckResult } from './types.js'

const SAFE_FALLBACK: FactCheckResult = {
  verdict: 'no_evidence',
  caveat: 'Could not process the response — treated as unverified',
  explanation: 'The fact-check service returned an unexpected response. Please try again.',
  sources: [],
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
  const data = parseModelJson(text, factCheckResultSchema)
  if (!data) return SAFE_FALLBACK
  return stripUnverifiedGuess(data)
}
