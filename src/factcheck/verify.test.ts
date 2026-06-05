import { describe, expect, it } from 'vitest'
import { verifyFactCheck } from './verify.js'
import type { FactCheckResult } from './types.js'

const supported: FactCheckResult = {
  verdict: 'supported',
  caveat: 'Sources agree',
  explanation: 'The claim holds.',
  sources: [{ title: 'Riksdagen', url: 'https://riksdagen.se/dokument/123' }],
}

describe('verifyFactCheck', () => {
  it('keeps a source whose hostname was actually retrieved (ignoring path/query/www)', () => {
    const result = verifyFactCheck(supported, ['https://www.riksdagen.se/'])
    expect(result.sources).toHaveLength(1)
    expect(result.basedOnModelKnowledge).toBeUndefined()
  })

  it('matches a source across subdomains (data.riksdagen.se ↔ riksdagen.se)', () => {
    const subdomain: FactCheckResult = {
      ...supported,
      sources: [{ title: 'Riksdagen data', url: 'https://data.riksdagen.se/dok/1' }],
    }
    const result = verifyFactCheck(subdomain, ['https://www.riksdagen.se/'])
    expect(result.sources).toHaveLength(1)
    expect(result.basedOnModelKnowledge).toBeUndefined()
  })

  it('does NOT match a look-alike domain (evil-riksdagen.se vs riksdagen.se)', () => {
    const lookalike: FactCheckResult = {
      ...supported,
      sources: [{ title: 'Fake', url: 'https://evil-riksdagen.se/x' }],
    }
    const result = verifyFactCheck(lookalike, ['https://riksdagen.se/x'])
    expect(result.sources).toEqual([])
    expect(result.basedOnModelKnowledge).toBe(true)
  })

  it('drops a fabricated source whose hostname was never retrieved', () => {
    const withFake: FactCheckResult = {
      ...supported,
      sources: [
        { title: 'Riksdagen', url: 'https://riksdagen.se/x' },
        { title: 'Fake', url: 'https://totally-made-up.example/y' },
      ],
    }
    const result = verifyFactCheck(withFake, ['https://riksdagen.se/x'])
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0].url).toContain('riksdagen.se')
  })

  it('flags a supported verdict (keeps it) when all sources are fabricated', () => {
    const result = verifyFactCheck(supported, ['https://scb.se/only-this'])
    expect(result.verdict).toBe('supported')
    expect(result.sources).toEqual([])
    expect(result.basedOnModelKnowledge).toBe(true)
    expect(result.caveat.toLowerCase()).toContain('own knowledge')
  })

  it('flags a disproven verdict the same way when unsourced', () => {
    const disproven: FactCheckResult = { ...supported, verdict: 'disproven', sources: [] }
    const result = verifyFactCheck(disproven, [])
    expect(result.verdict).toBe('disproven')
    expect(result.basedOnModelKnowledge).toBe(true)
  })

  it('does NOT flag when at least one real source survives', () => {
    const mixed: FactCheckResult = {
      ...supported,
      sources: [
        { title: 'Real', url: 'https://scb.se/a' },
        { title: 'Fake', url: 'https://made-up.example/b' },
      ],
    }
    const result = verifyFactCheck(mixed, ['https://scb.se/a'])
    expect(result.basedOnModelKnowledge).toBeUndefined()
    expect(result.sources).toHaveLength(1)
  })

  it('does NOT flag an opinion verdict even with no sources', () => {
    const opinion: FactCheckResult = { ...supported, verdict: 'opinion', sources: [] }
    const result = verifyFactCheck(opinion, [])
    expect(result.verdict).toBe('opinion')
    expect(result.basedOnModelKnowledge).toBeUndefined()
  })

  it('does NOT flag a no_evidence verdict and preserves its educated guess', () => {
    const noEvidence: FactCheckResult = {
      verdict: 'no_evidence',
      caveat: 'Nothing found',
      explanation: 'Could not verify.',
      sources: [],
      educatedGuess: 'Maybe true.',
    }
    const result = verifyFactCheck(noEvidence, [])
    expect(result.verdict).toBe('no_evidence')
    expect(result.basedOnModelKnowledge).toBeUndefined()
    expect(result.educatedGuess).toBe('Maybe true.')
  })

  it('drops a malformed source URL without throwing', () => {
    const malformed: FactCheckResult = {
      ...supported,
      sources: [{ title: 'Bad', url: 'not a url' }],
    }
    const result = verifyFactCheck(malformed, ['https://riksdagen.se/x'])
    expect(result.sources).toEqual([])
    expect(result.basedOnModelKnowledge).toBe(true)
  })

  it('does not mutate the input result', () => {
    const input: FactCheckResult = {
      ...supported,
      sources: [{ title: 'Fake', url: 'https://made-up.example/b' }],
    }
    verifyFactCheck(input, [])
    expect(input.sources).toHaveLength(1)
    expect(input.verdict).toBe('supported')
  })
})
