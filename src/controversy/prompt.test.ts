import { describe, expect, it } from 'vitest'
import { buildSystemPrompt, buildUserMessage } from './prompt.js'

describe('buildSystemPrompt', () => {
  const prompt = buildSystemPrompt()

  it('covers all four research categories', () => {
    expect(prompt.toLowerCase()).toContain('court case')
    expect(prompt.toLowerCase()).toContain('country ban')
    expect(prompt.toLowerCase()).toContain('platform ban')
    expect(prompt.toLowerCase()).toMatch(/major critique|critique/)
  })

  it('contains an anti-fabrication rule', () => {
    expect(prompt).toMatch(/never fabricate|never invent|never make up/i)
  })

  it('contains a score guide with range 1–10', () => {
    expect(prompt).toMatch(/1.{0,5}10|score/)
    expect(prompt).toMatch(/1[–-]2|9[–-]10/)
  })

  it('requires empty arrays instead of placeholder entries', () => {
    expect(prompt).toMatch(/empty array/i)
  })

  it('contains the JSON output contract fields', () => {
    expect(prompt).toContain('"score"')
    expect(prompt).toContain('"summary"')
    expect(prompt).toContain('"courtCases"')
    expect(prompt).toContain('"countryBans"')
    expect(prompt).toContain('"platformBans"')
    expect(prompt).toContain('"majorCritique"')
    expect(prompt).toContain('"sources"')
  })

  it('instructs to output ONLY JSON', () => {
    expect(prompt).toMatch(/only.*json|json.*only/i)
  })
})

describe('buildUserMessage', () => {
  it('includes the topic text', () => {
    const topic = 'Elon Musk'
    const message = buildUserMessage(topic)
    expect(message).toContain(topic)
  })

  it('returns a non-empty string', () => {
    expect(buildUserMessage('any topic').length).toBeGreaterThan(0)
  })
})
