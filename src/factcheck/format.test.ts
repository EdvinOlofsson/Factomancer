import { describe, expect, it } from 'vitest'
import { formatFactCheckEmbed } from './format.js'
import type { FactCheckResult } from './types.js'

const base: FactCheckResult = {
  verdict: 'supported',
  caveat: 'Multiple official sources agree',
  explanation: 'The claim is supported by official data.',
  sources: [],
}

describe('formatFactCheckEmbed', () => {
  it('uses green (0x2ecc71) for supported', () => {
    const embed = formatFactCheckEmbed(base, 'Test claim')
    expect(embed.data.color).toBe(0x2ecc71)
  })

  it('uses red (0xe74c3c) for disproven', () => {
    const embed = formatFactCheckEmbed({ ...base, verdict: 'disproven' }, 'Test claim')
    expect(embed.data.color).toBe(0xe74c3c)
  })

  it('uses grey (0x95a5a6) for no_evidence', () => {
    const embed = formatFactCheckEmbed({ ...base, verdict: 'no_evidence' }, 'Test claim')
    expect(embed.data.color).toBe(0x95a5a6)
  })

  it('uses gold (0xf39c12) for opinion', () => {
    const embed = formatFactCheckEmbed({ ...base, verdict: 'opinion' }, 'Test claim')
    expect(embed.data.color).toBe(0xf39c12)
  })

  it('includes the claim in the description', () => {
    const embed = formatFactCheckEmbed(base, 'My specific test claim')
    expect(embed.data.description).toContain('My specific test claim')
  })

  it('puts caveat in footer', () => {
    const embed = formatFactCheckEmbed(base, 'Test claim')
    expect(embed.data.footer?.text).toContain('Multiple official sources agree')
  })

  it('renders sources as markdown links in a Sources field', () => {
    const result: FactCheckResult = {
      ...base,
      sources: [
        { title: 'Riksdagen', url: 'https://riksdagen.se' },
        { title: 'SCB', url: 'https://scb.se' },
      ],
    }
    const embed = formatFactCheckEmbed(result, 'Test claim')
    const sourceField = embed.data.fields?.find((f) => f.name === 'Sources')
    expect(sourceField?.value).toContain('[Riksdagen](https://riksdagen.se)')
    expect(sourceField?.value).toContain('[SCB](https://scb.se)')
  })

  it('caps sources at 5', () => {
    const result: FactCheckResult = {
      ...base,
      sources: Array.from({ length: 8 }, (_, i) => ({
        title: `Source ${i}`,
        url: `https://example.com/${i}`,
      })),
    }
    const embed = formatFactCheckEmbed(result, 'Test claim')
    const sourceField = embed.data.fields?.find((f) => f.name === 'Sources')
    const linkCount = (sourceField?.value.match(/\[/g) ?? []).length
    expect(linkCount).toBe(5)
  })

  it('shows no Sources field when sources array is empty', () => {
    const embed = formatFactCheckEmbed(base, 'Test claim')
    const sourceField = embed.data.fields?.find((f) => f.name === 'Sources')
    expect(sourceField).toBeUndefined()
  })

  it('shows a clearly-labeled educated guess field for no_evidence', () => {
    const result: FactCheckResult = {
      ...base,
      verdict: 'no_evidence',
      educatedGuess: 'Probably around 30% based on trends.',
    }
    const embed = formatFactCheckEmbed(result, 'Test claim')
    const guessField = embed.data.fields?.find((f) =>
      f.name.toLowerCase().includes('educated'),
    )
    expect(guessField).toBeDefined()
    expect(guessField?.value).toContain('Probably around 30%')
  })

  it('does not show an educated guess field when absent', () => {
    const embed = formatFactCheckEmbed(base, 'Test claim')
    const guessField = embed.data.fields?.find((f) =>
      f.name.toLowerCase().includes('educated'),
    )
    expect(guessField).toBeUndefined()
  })
})
