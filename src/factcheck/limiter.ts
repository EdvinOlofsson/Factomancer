const PER_USER_LIMIT = Math.max(1, Number(process.env.RATE_LIMIT_PER_USER_HOUR ?? '5'))
const GLOBAL_DAILY_LIMIT = Math.max(1, Number(process.env.RATE_LIMIT_GLOBAL_DAILY ?? '20'))
const HOUR_MS = 60 * 60 * 1000

const userWindows = new Map<string, number[]>()
let dailyKey = todayKey()
let dailyCount = 0
let dailySearches = 0

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function refreshDaily(): void {
  const key = todayKey()
  if (key !== dailyKey) {
    dailyKey = key
    dailyCount = 0
    dailySearches = 0
  }
}

export interface RateLimitResult {
  allowed: boolean
  reason?: string
  retryAfterMs?: number
}

export interface UsageStats {
  userCallsThisHour: number
  userCallsHourLimit: number
  globalCallsToday: number
  globalDailyLimit: number
  totalSearchesToday: number
}

export function checkRateLimit(userId: string): RateLimitResult {
  refreshDaily()

  if (dailyCount >= GLOBAL_DAILY_LIMIT) {
    return {
      allowed: false,
      reason: `Daily limit reached (${GLOBAL_DAILY_LIMIT} fact-checks/day). Resets at midnight UTC.`,
    }
  }

  const now = Date.now()
  const timestamps = (userWindows.get(userId) ?? []).filter((t) => t > now - HOUR_MS)
  userWindows.set(userId, timestamps)

  if (timestamps.length >= PER_USER_LIMIT) {
    const retryAfterMs = timestamps[0] + HOUR_MS - now
    const minutes = Math.ceil(retryAfterMs / 60_000)
    return {
      allowed: false,
      reason: `You've used all ${PER_USER_LIMIT} of your hourly fact-checks. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      retryAfterMs,
    }
  }

  return { allowed: true }
}

export function recordUsage(userId: string, searchesUsed = 0): void {
  refreshDaily()
  const timestamps = userWindows.get(userId) ?? []
  timestamps.push(Date.now())
  userWindows.set(userId, timestamps)
  dailyCount++
  dailySearches += searchesUsed
}

export function getUsageStats(userId: string): UsageStats {
  refreshDaily()
  const now = Date.now()
  const timestamps = (userWindows.get(userId) ?? []).filter((t) => t > now - HOUR_MS)
  return {
    userCallsThisHour: timestamps.length,
    userCallsHourLimit: PER_USER_LIMIT,
    globalCallsToday: dailyCount,
    globalDailyLimit: GLOBAL_DAILY_LIMIT,
    totalSearchesToday: dailySearches,
  }
}

export function _resetForTesting(): void {
  userWindows.clear()
  dailyKey = todayKey()
  dailyCount = 0
  dailySearches = 0
}
