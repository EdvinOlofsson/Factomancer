import { describe, expect, it } from 'vitest'
import { parseControversyResult } from './parse.js'

const validResult = {
  score: 7,
  summary: 'Highly controversial figure with multiple legal issues.',
  courtCases: [{ description: 'Tax fraud', jurisdiction: 'USA', status: 'ongoing' }],
  countryBans: [{ targets: ['Russia'], reason: 'Sanctions', url: 'https://example.com' }],
  platformBans: [],
  majorCritique: [],
  sources: [{ title: 'Reuters', url: 'https://reuters.com/article/1' }],
}

describe('parseControversyResult', () => {
  it('parses a valid JSON result', () => {
    const result = parseControversyResult(JSON.stringify(validResult))
    expect(result.score).toBe(7)
    expect(result.summary).toBe('Highly controversial figure with multiple legal issues.')
    expect(result.courtCases).toHaveLength(1)
    expect(result.sources).toHaveLength(1)
  })

  it('parses JSON inside a ```json code fence', () => {
    const input = '```json\n' + JSON.stringify(validResult) + '\n```'
    const result = parseControversyResult(input)
    expect(result.score).toBe(7)
  })

  it('parses JSON inside a plain ``` code fence', () => {
    const input = '```\n' + JSON.stringify(validResult) + '\n```'
    const result = parseControversyResult(input)
    expect(result.score).toBe(7)
  })

  it('returns fallback for non-JSON text', () => {
    const result = parseControversyResult('not json at all')
    expect(result.score).toBe(1)
    expect(result.sources).toEqual([])
  })

  it('returns fallback for empty string', () => {
    const result = parseControversyResult('')
    expect(result.score).toBe(1)
    expect(result.courtCases).toEqual([])
  })

  it('returns fallback when score is out of range', () => {
    const bad = { ...validResult, score: 0 }
    const result = parseControversyResult(JSON.stringify(bad))
    expect(result.score).toBe(1)
  })

  it('returns fallback when score is above 10', () => {
    const bad = { ...validResult, score: 11 }
    const result = parseControversyResult(JSON.stringify(bad))
    expect(result.score).toBe(1)
  })

  it('returns fallback when required field summary is missing', () => {
    const { summary: _, ...bad } = validResult
    const result = parseControversyResult(JSON.stringify(bad))
    expect(result.score).toBe(1)
  })

  it('skips a non-matching JSON object and parses the valid one', () => {
    const input = '{"foo":"bar"}\n' + JSON.stringify(validResult)
    const result = parseControversyResult(input)
    expect(result.score).toBe(7)
  })

  it('handles JSON string values containing braces', () => {
    const braces = { ...validResult, summary: 'Has {many} issues' }
    const result = parseControversyResult(JSON.stringify(braces))
    expect(result.summary).toContain('{')
  })

  it('returns empty arrays for optional category fields when absent', () => {
    const minimal = {
      score: 2,
      summary: 'Minimal controversy.',
      courtCases: [],
      countryBans: [],
      platformBans: [],
      majorCritique: [],
      sources: [],
    }
    const result = parseControversyResult(JSON.stringify(minimal))
    expect(result.courtCases).toEqual([])
    expect(result.platformBans).toEqual([])
  })
})
