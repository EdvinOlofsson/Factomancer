import { describe, expect, it } from 'vitest'
import { buildPerspectivesPrompt, buildPerspectivesUserMessage } from './prompt.js'

describe('buildPerspectivesPrompt', () => {
  const prompt = buildPerspectivesPrompt()

  it('names all four lenses', () => {
    expect(prompt).toContain('"left"')
    expect(prompt).toContain('"right"')
    expect(prompt).toContain('"libertarian"')
    expect(prompt).toContain('"authoritarian"')
  })

  it('requires charitable, non-strawman framing', () => {
    expect(prompt.toLowerCase()).toMatch(/charitable|strongest|strawman/)
  })

  it('instructs to match the topic intensity', () => {
    expect(prompt.toLowerCase()).toMatch(/intensity|sanitise|register/)
  })

  it('states the safety floor (no operational harm or slurs)', () => {
    expect(prompt.toLowerCase()).toMatch(/operational|slur|harm/)
  })

  it('mirrors the topic language', () => {
    expect(prompt.toLowerCase()).toContain('same language')
  })

  it('forbids adjudicating which perspective is right', () => {
    expect(prompt.toLowerCase()).toMatch(/never adjudicate|which perspective is right/)
  })
})

describe('buildPerspectivesUserMessage', () => {
  it('includes the topic', () => {
    expect(buildPerspectivesUserMessage('nuclear energy')).toContain('nuclear energy')
  })
})
