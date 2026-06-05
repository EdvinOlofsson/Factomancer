import { describe, expect, it } from 'vitest'
import { parsePerspectives } from './parse.js'

const valid = JSON.stringify({
  left: 'Left view.',
  right: 'Right view.',
  libertarian: 'Libertarian view.',
  authoritarian: 'Authoritarian view.',
})

describe('parsePerspectives', () => {
  it('parses a valid four-lens object', () => {
    const result = parsePerspectives(valid)
    expect(result).not.toBeNull()
    expect(result?.left).toBe('Left view.')
    expect(result?.authoritarian).toBe('Authoritarian view.')
  })

  it('extracts JSON embedded in surrounding prose', () => {
    const result = parsePerspectives(`Here you go:\n${valid}\nDone.`)
    expect(result?.right).toBe('Right view.')
  })

  it('returns null when a lens is missing', () => {
    const missing = JSON.stringify({
      left: 'a',
      right: 'b',
      libertarian: 'c',
    })
    expect(parsePerspectives(missing)).toBeNull()
  })

  it('returns null for malformed output', () => {
    expect(parsePerspectives('not json at all')).toBeNull()
  })

  it('returns null when a lens is empty', () => {
    const empty = JSON.stringify({
      left: '',
      right: 'b',
      libertarian: 'c',
      authoritarian: 'd',
    })
    expect(parsePerspectives(empty)).toBeNull()
  })
})
