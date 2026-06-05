import { beforeEach, describe, expect, it } from 'vitest'
import {
  _resetForTesting,
  checkRateLimit,
  getUsageStats,
  recordUsage,
} from './limiter.js'

beforeEach(() => {
  _resetForTesting()
})

describe('checkRateLimit — per-user', () => {
  it('allows calls under the hourly limit', () => {
    expect(checkRateLimit('u1').allowed).toBe(true)
  })

  it('blocks the user after exceeding the hourly limit', () => {
    for (let i = 0; i < 5; i++) recordUsage('u1')
    const result = checkRateLimit('u1')
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/hourly/i)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it('allows a different user while another is blocked', () => {
    for (let i = 0; i < 5; i++) recordUsage('u1')
    expect(checkRateLimit('u2').allowed).toBe(true)
  })
})

describe('checkRateLimit — global daily', () => {
  it('blocks all users after the global daily limit', () => {
    for (let i = 0; i < 20; i++) recordUsage(`user-${i}`)
    const result = checkRateLimit('new-user')
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/daily/i)
    expect(result.retryAfterMs).toBeUndefined()
  })

  it('checks global limit before per-user limit', () => {
    for (let i = 0; i < 20; i++) recordUsage(`user-${i}`)
    const result = checkRateLimit('fresh-user')
    expect(result.reason).toMatch(/daily/i)
  })
})

describe('recordUsage', () => {
  it('increments global call count', () => {
    recordUsage('u1')
    recordUsage('u1')
    const stats = getUsageStats('u1')
    expect(stats.globalCallsToday).toBe(2)
  })

  it('accumulates searches used', () => {
    recordUsage('u1', 3)
    recordUsage('u2', 2)
    const stats = getUsageStats('u1')
    expect(stats.totalSearchesToday).toBe(5)
  })
})

describe('getUsageStats', () => {
  it('returns zero counts on a fresh start', () => {
    const stats = getUsageStats('u1')
    expect(stats.userCallsThisHour).toBe(0)
    expect(stats.globalCallsToday).toBe(0)
    expect(stats.totalSearchesToday).toBe(0)
  })

  it('reflects recorded usage for the queried user', () => {
    recordUsage('u1')
    recordUsage('u1')
    recordUsage('u2')
    const stats = getUsageStats('u1')
    expect(stats.userCallsThisHour).toBe(2)
    expect(stats.globalCallsToday).toBe(3)
  })

  it('exposes the configured limits', () => {
    const stats = getUsageStats('u1')
    expect(stats.userCallsHourLimit).toBeGreaterThan(0)
    expect(stats.globalDailyLimit).toBeGreaterThan(0)
  })
})
