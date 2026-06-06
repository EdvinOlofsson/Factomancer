import { describe, expect, it } from 'vitest'
import { verifyControversyResult } from './verify.js'
import type { ControversyResult } from './types.js'

const base: ControversyResult = {
  score: 7,
  summary: 'Controversial person.',
  courtCases: [{ description: 'Tax fraud', jurisdiction: 'USA', status: 'ongoing' }],
  countryBans: [],
  platformBans: [],
  majorCritique: [],
  sources: [{ title: 'Reuters', url: 'https://reuters.com/article/1' }],
}

describe('verifyControversyResult', () => {
  it('keeps a source whose hostname was actually retrieved', () => {
    const result = verifyControversyResult(base, ['https://reuters.com/article/1'])
    expect(result.sources).toHaveLength(1)
    expect(result.basedOnModelKnowledge).toBeUndefined()
  })

  it('matches ignoring www prefix', () => {
    const result = verifyControversyResult(base, ['https://www.reuters.com/article/1'])
    expect(result.sources).toHaveLength(1)
  })

  it('matches across subdomains (news.bbc.co.uk ↔ bbc.co.uk)', () => {
    const subdomain: ControversyResult = {
      ...base,
      sources: [{ title: 'BBC', url: 'https://news.bbc.co.uk/story' }],
    }
    const result = verifyControversyResult(subdomain, ['https://bbc.co.uk/home'])
    expect(result.sources).toHaveLength(1)
  })

  it('does NOT match a look-alike domain', () => {
    const lookalike: ControversyResult = {
      ...base,
      sources: [{ title: 'Fake', url: 'https://evil-reuters.com/article' }],
    }
    const result = verifyControversyResult(lookalike, ['https://reuters.com/article'])
    expect(result.sources).toEqual([])
  })

  it('drops a fabricated source whose hostname was never retrieved', () => {
    const withFake: ControversyResult = {
      ...base,
      sources: [
        { title: 'Reuters', url: 'https://reuters.com/article/1' },
        { title: 'Fake', url: 'https://totally-made-up.example/y' },
      ],
    }
    const result = verifyControversyResult(withFake, ['https://reuters.com/article/1'])
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0].url).toContain('reuters.com')
  })

  it('sets basedOnModelKnowledge when findings exist but no sources retrieved', () => {
    const result = verifyControversyResult(base, ['https://scb.se/other'])
    expect(result.basedOnModelKnowledge).toBe(true)
    expect(result.sources).toEqual([])
  })

  it('does NOT set basedOnModelKnowledge when all categories are empty', () => {
    const empty: ControversyResult = {
      ...base,
      courtCases: [],
      countryBans: [],
      platformBans: [],
      majorCritique: [],
      sources: [],
    }
    const result = verifyControversyResult(empty, [])
    expect(result.basedOnModelKnowledge).toBeUndefined()
  })

  it('does NOT set basedOnModelKnowledge when at least one real source survives', () => {
    const mixed: ControversyResult = {
      ...base,
      sources: [
        { title: 'Reuters', url: 'https://reuters.com/article/1' },
        { title: 'Fake', url: 'https://made-up.example/b' },
      ],
    }
    const result = verifyControversyResult(mixed, ['https://reuters.com/article/1'])
    expect(result.basedOnModelKnowledge).toBeUndefined()
    expect(result.sources).toHaveLength(1)
  })

  it('drops a source with a malformed URL without throwing', () => {
    const malformed: ControversyResult = {
      ...base,
      sources: [{ title: 'Bad', url: 'not a url' }],
    }
    const result = verifyControversyResult(malformed, ['https://reuters.com/article/1'])
    expect(result.sources).toEqual([])
    expect(result.basedOnModelKnowledge).toBe(true)
  })

  it('preserves score and summary unchanged', () => {
    const result = verifyControversyResult(base, ['https://reuters.com/article/1'])
    expect(result.score).toBe(7)
    expect(result.summary).toBe('Controversial person.')
  })

  it('does not mutate the input result', () => {
    const input: ControversyResult = {
      ...base,
      sources: [{ title: 'Fake', url: 'https://made-up.example/b' }],
    }
    verifyControversyResult(input, [])
    expect(input.sources).toHaveLength(1)
  })
})
