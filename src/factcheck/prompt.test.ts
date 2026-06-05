import { describe, expect, it } from 'vitest'
import { buildSystemPrompt, buildUserMessage } from './prompt.js'

describe('buildSystemPrompt', () => {
  const prompt = buildSystemPrompt()

  it('contains all four verdict labels', () => {
    expect(prompt).toContain('supported')
    expect(prompt).toContain('disproven')
    expect(prompt).toContain('no_evidence')
    expect(prompt).toContain('opinion')
  })

  it('contains an anti-fabrication rule', () => {
    expect(prompt).toMatch(/never invent|never fabricate|never make up/i)
  })

  it('contains a language-mirror instruction', () => {
    expect(prompt.toLowerCase()).toContain('same language')
  })

  it('names official Swedish sources (tiering)', () => {
    expect(prompt).toContain('riksdagen.se')
    expect(prompt).toContain('scb.se')
  })

  it('contains the JSON output contract fields', () => {
    expect(prompt).toContain('"verdict"')
    expect(prompt).toContain('"explanation"')
    expect(prompt).toContain('"sources"')
    expect(prompt).toContain('"caveat"')
  })

  it('restricts educatedGuess to no_evidence only', () => {
    expect(prompt).toMatch(/educated.?guess/i)
    expect(prompt).toContain('no_evidence')
  })

  it('defines fact-vs-opinion criteria', () => {
    expect(prompt.toLowerCase()).toMatch(/value judgment|interpretation|prediction/)
  })

  it('bounds the opinion both-sides guidance and forbids taking a side', () => {
    expect(prompt.toLowerCase()).toMatch(/each side|both sides/)
    expect(prompt.toLowerCase()).toMatch(/which side is right|never.*side/)
  })

  it('includes worked examples', () => {
    expect(prompt).toMatch(/## Examples/)
  })
})

describe('buildUserMessage', () => {
  it('includes the claim text', () => {
    const claim = 'Sverige har EU:s högsta bensinskatt'
    const message = buildUserMessage(claim)
    expect(message).toContain(claim)
  })

  it('returns a non-empty string', () => {
    expect(buildUserMessage('any claim').length).toBeGreaterThan(0)
  })
})
