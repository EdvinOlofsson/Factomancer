import { describe, expect, it } from 'vitest'
import { formatControversyEmbed } from './format.js'
import type { VerifiedControversyResult } from './types.js'

const base: VerifiedControversyResult = {
  score: 5,
  summary: 'Moderate controversy.',
  courtCases: [],
  countryBans: [],
  platformBans: [],
  majorCritique: [],
  sources: [],
}

describe('formatControversyEmbed — score labels and colors', () => {
  it('score 1–2 → Low, green', () => {
    const embed = formatControversyEmbed({ ...base, score: 1 }, 'Test Topic')
    expect(embed.data.title).toContain('Low')
    expect(embed.data.title).toContain('1/10')
    expect(embed.data.color).toBe(0x2ecc71)
  })

  it('score 3–4 → Moderate, yellow', () => {
    const embed = formatControversyEmbed({ ...base, score: 4 }, 'Test Topic')
    expect(embed.data.title).toContain('Moderate')
    expect(embed.data.color).toBe(0xf1c40f)
  })

  it('score 5–6 → Elevated, orange', () => {
    const embed = formatControversyEmbed({ ...base, score: 6 }, 'Test Topic')
    expect(embed.data.title).toContain('Elevated')
    expect(embed.data.color).toBe(0xe67e22)
  })

  it('score 7–8 → High, red', () => {
    const embed = formatControversyEmbed({ ...base, score: 8 }, 'Test Topic')
    expect(embed.data.title).toContain('High')
    expect(embed.data.color).toBe(0xe74c3c)
  })

  it('score 9–10 → Extreme, purple', () => {
    const embed = formatControversyEmbed({ ...base, score: 10 }, 'Test Topic')
    expect(embed.data.title).toContain('Extreme')
    expect(embed.data.color).toBe(0x8e44ad)
  })
})

describe('formatControversyEmbed — title', () => {
  it('includes topic in title', () => {
    const embed = formatControversyEmbed(base, 'Elon Musk')
    expect(embed.data.title).toContain('Elon Musk')
  })

  it('includes score in title as X/10', () => {
    const embed = formatControversyEmbed({ ...base, score: 5 }, 'Test')
    expect(embed.data.title).toContain('5/10')
  })

  it('truncates topic to 100 chars', () => {
    const longTopic = 'A'.repeat(200)
    const embed = formatControversyEmbed(base, longTopic)
    expect(embed.data.title!.includes('A'.repeat(101))).toBe(false)
  })
})

describe('formatControversyEmbed — category fields', () => {
  it('shows court cases field when non-empty', () => {
    const result: VerifiedControversyResult = {
      ...base,
      courtCases: [{ description: 'Tax fraud', jurisdiction: 'USA', status: 'ongoing' }],
    }
    const embed = formatControversyEmbed(result, 'Test')
    const field = embed.data.fields?.find((f) => f.name.includes('Court'))
    expect(field).toBeDefined()
    expect(field?.value).toContain('Tax fraud')
    expect(field?.value).toContain('USA')
  })

  it('omits court cases field when empty', () => {
    const embed = formatControversyEmbed(base, 'Test')
    const field = embed.data.fields?.find((f) => f.name.includes('Court'))
    expect(field).toBeUndefined()
  })

  it('shows country bans field when non-empty', () => {
    const result: VerifiedControversyResult = {
      ...base,
      countryBans: [{ targets: ['Russia', 'China'], reason: 'Sanctions' }],
    }
    const embed = formatControversyEmbed(result, 'Test')
    const field = embed.data.fields?.find((f) => f.name.includes('Country'))
    expect(field).toBeDefined()
    expect(field?.value).toContain('Russia')
    expect(field?.value).toContain('China')
  })

  it('omits country bans field when empty', () => {
    const embed = formatControversyEmbed(base, 'Test')
    expect(embed.data.fields?.find((f) => f.name.includes('Country'))).toBeUndefined()
  })

  it('shows platform bans field when non-empty', () => {
    const result: VerifiedControversyResult = {
      ...base,
      platformBans: [{ targets: ['Twitter', 'Facebook'], reason: 'Policy violation' }],
    }
    const embed = formatControversyEmbed(result, 'Test')
    const field = embed.data.fields?.find((f) => f.name.includes('Platform'))
    expect(field).toBeDefined()
    expect(field?.value).toContain('Twitter')
  })

  it('omits platform bans field when empty', () => {
    const embed = formatControversyEmbed(base, 'Test')
    expect(embed.data.fields?.find((f) => f.name.includes('Platform'))).toBeUndefined()
  })

  it('shows major critique field when non-empty', () => {
    const result: VerifiedControversyResult = {
      ...base,
      majorCritique: [{ group: 'Amnesty International', critique: 'Human rights abuses' }],
    }
    const embed = formatControversyEmbed(result, 'Test')
    const field = embed.data.fields?.find((f) => f.name.includes('Critique'))
    expect(field).toBeDefined()
    expect(field?.value).toContain('Amnesty International')
  })

  it('omits major critique field when empty', () => {
    const embed = formatControversyEmbed(base, 'Test')
    expect(embed.data.fields?.find((f) => f.name.includes('Critique'))).toBeUndefined()
  })

  it('caps each category at 5 entries', () => {
    const result: VerifiedControversyResult = {
      ...base,
      majorCritique: Array.from({ length: 8 }, (_, i) => ({
        group: `Group ${i}`,
        critique: `Critique ${i}`,
      })),
    }
    const embed = formatControversyEmbed(result, 'Test')
    const field = embed.data.fields?.find((f) => f.name.includes('Critique'))
    const count = (field?.value.match(/\*\*/g) ?? []).length / 2
    expect(count).toBeLessThanOrEqual(5)
  })
})

describe('formatControversyEmbed — sources', () => {
  it('renders sources as numbered markdown links', () => {
    const result: VerifiedControversyResult = {
      ...base,
      sources: [
        { title: 'Reuters', url: 'https://reuters.com' },
        { title: 'BBC', url: 'https://bbc.co.uk' },
      ],
    }
    const embed = formatControversyEmbed(result, 'Test')
    const field = embed.data.fields?.find((f) => f.name === 'Sources')
    expect(field?.value).toContain('[Reuters](https://reuters.com)')
    expect(field?.value).toContain('[BBC](https://bbc.co.uk)')
  })

  it('omits sources field when empty', () => {
    const embed = formatControversyEmbed(base, 'Test')
    expect(embed.data.fields?.find((f) => f.name === 'Sources')).toBeUndefined()
  })

  it('caps sources at 5', () => {
    const result: VerifiedControversyResult = {
      ...base,
      sources: Array.from({ length: 8 }, (_, i) => ({
        title: `Source ${i}`,
        url: `https://example.com/${i}`,
      })),
    }
    const embed = formatControversyEmbed(result, 'Test')
    const field = embed.data.fields?.find((f) => f.name === 'Sources')
    const linkCount = (field?.value.match(/\[/g) ?? []).length
    expect(linkCount).toBe(5)
  })
})

describe('formatControversyEmbed — model knowledge warning', () => {
  it('shows warning when basedOnModelKnowledge is true', () => {
    const result: VerifiedControversyResult = { ...base, basedOnModelKnowledge: true }
    const embed = formatControversyEmbed(result, 'Test')
    const warning = embed.data.fields?.find((f) => f.name.includes('No sources'))
    expect(warning).toBeDefined()
    expect(warning?.value).toContain("model's own knowledge")
  })

  it('omits warning when basedOnModelKnowledge is not set', () => {
    const embed = formatControversyEmbed(base, 'Test')
    expect(embed.data.fields?.find((f) => f.name.includes('No sources'))).toBeUndefined()
  })
})
