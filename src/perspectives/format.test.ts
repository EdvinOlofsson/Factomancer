import { describe, expect, it } from 'vitest'
import { formatPerspectivesEmbed } from './format.js'
import type { PerspectivesResult } from './types.js'

const sample: PerspectivesResult = {
  left: 'Left framing.',
  right: 'Right framing.',
  libertarian: 'Libertarian framing.',
  authoritarian: 'Authoritarian framing.',
}

describe('formatPerspectivesEmbed', () => {
  it('renders all four labelled lens fields', () => {
    const embed = formatPerspectivesEmbed(sample, 'nuclear energy')
    const names = embed.data.fields?.map((f) => f.name) ?? []
    expect(names.some((n) => n.includes('Left'))).toBe(true)
    expect(names.some((n) => n.includes('Right'))).toBe(true)
    expect(names.some((n) => n.includes('Libertarian'))).toBe(true)
    expect(names.some((n) => n.includes('Authoritarian'))).toBe(true)
  })

  it('puts the topic in the title', () => {
    const embed = formatPerspectivesEmbed(sample, 'nuclear energy')
    expect(embed.data.title).toContain('nuclear energy')
  })

  it('includes a disclaimer footer', () => {
    const embed = formatPerspectivesEmbed(sample, 'topic')
    expect(embed.data.footer?.text).toContain('not facts')
  })

  it('caps a long lens value at 1024 characters', () => {
    const long: PerspectivesResult = { ...sample, left: 'x'.repeat(2000) }
    const embed = formatPerspectivesEmbed(long, 'topic')
    const leftField = embed.data.fields?.find((f) => f.name.includes('Left'))
    expect(leftField?.value.length).toBeLessThanOrEqual(1024)
  })
})
