import { describe, expect, it } from 'vitest'
import { parseFactCheckResult } from './parse.js'

describe('parseFactCheckResult', () => {
  it('parses a valid JSON verdict', () => {
    const input = JSON.stringify({
      verdict: 'supported',
      caveat: 'Multiple sources agree',
      explanation: 'The claim is supported.',
      sources: [{ title: 'Wikipedia', url: 'https://en.wikipedia.org' }],
    })
    const result = parseFactCheckResult(input)
    expect(result.verdict).toBe('supported')
    expect(result.caveat).toBe('Multiple sources agree')
    expect(result.sources).toHaveLength(1)
  })

  it('parses JSON inside a ```json code fence', () => {
    const input =
      '```json\n{"verdict":"disproven","caveat":"Clear counter-evidence","explanation":"Disproved.","sources":[]}\n```'
    const result = parseFactCheckResult(input)
    expect(result.verdict).toBe('disproven')
  })

  it('parses JSON inside a plain ``` code fence', () => {
    const input =
      '```\n{"verdict":"opinion","caveat":"Value judgment","explanation":"This is opinion.","sources":[]}\n```'
    const result = parseFactCheckResult(input)
    expect(result.verdict).toBe('opinion')
  })

  it('returns no_evidence fallback for non-JSON text', () => {
    const result = parseFactCheckResult('this is not json at all')
    expect(result.verdict).toBe('no_evidence')
    expect(result.sources).toEqual([])
  })

  it('returns no_evidence fallback for invalid schema (missing explanation)', () => {
    const input = JSON.stringify({ verdict: 'supported', caveat: 'ok', sources: [] })
    const result = parseFactCheckResult(input)
    expect(result.verdict).toBe('no_evidence')
  })

  it('returns no_evidence fallback for unknown verdict value', () => {
    const input = JSON.stringify({
      verdict: 'maybe',
      caveat: 'ok',
      explanation: 'test',
      sources: [],
    })
    const result = parseFactCheckResult(input)
    expect(result.verdict).toBe('no_evidence')
  })

  it('allows educatedGuess when verdict is no_evidence', () => {
    const input = JSON.stringify({
      verdict: 'no_evidence',
      caveat: 'Thin evidence',
      explanation: 'Could not verify.',
      sources: [],
      educatedGuess: 'Probably around 30%.',
    })
    const result = parseFactCheckResult(input)
    expect(result.educatedGuess).toBe('Probably around 30%.')
  })

  it('strips educatedGuess when verdict is not no_evidence', () => {
    const input = JSON.stringify({
      verdict: 'supported',
      caveat: 'Strong evidence',
      explanation: 'Supported by data.',
      sources: [],
      educatedGuess: 'Should not appear.',
    })
    const result = parseFactCheckResult(input)
    expect(result.educatedGuess).toBeUndefined()
  })

  it('returns fallback with no fabricated sources on empty string input', () => {
    const result = parseFactCheckResult('')
    expect(result.verdict).toBe('no_evidence')
    expect(result.sources).toEqual([])
    expect(result.educatedGuess).toBeUndefined()
  })
})
