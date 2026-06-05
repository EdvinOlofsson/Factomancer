import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { extractJsonCandidates, parseModelJson } from './json-extract.js'

describe('extractJsonCandidates', () => {
  it('extracts a single object', () => {
    expect(extractJsonCandidates('{"a":1}')).toEqual(['{"a":1}'])
  })

  it('extracts multiple top-level objects in document order', () => {
    expect(extractJsonCandidates('{"a":1} text {"b":2}')).toEqual(['{"a":1}', '{"b":2}'])
  })

  it('handles nested objects as one candidate', () => {
    expect(extractJsonCandidates('{"a":{"b":1}}')).toEqual(['{"a":{"b":1}}'])
  })

  it('ignores braces inside string values', () => {
    expect(extractJsonCandidates('{"a":"has } brace"}')).toEqual(['{"a":"has } brace"}'])
  })

  it('returns empty array when no object is present', () => {
    expect(extractJsonCandidates('no json here')).toEqual([])
  })
})

const schema = z.object({ name: z.string(), age: z.number() })

describe('parseModelJson', () => {
  it('returns parsed data for valid JSON matching the schema', () => {
    expect(parseModelJson('{"name":"x","age":3}', schema)).toEqual({ name: 'x', age: 3 })
  })

  it('skips a non-matching object and returns the valid one', () => {
    const text = 'example: {"foo":"bar"} answer: {"name":"y","age":4}'
    expect(parseModelJson(text, schema)).toEqual({ name: 'y', age: 4 })
  })

  it('returns null when no candidate matches the schema', () => {
    expect(parseModelJson('{"foo":"bar"}', schema)).toBeNull()
  })

  it('returns null for non-JSON text', () => {
    expect(parseModelJson('nothing here', schema)).toBeNull()
  })
})
