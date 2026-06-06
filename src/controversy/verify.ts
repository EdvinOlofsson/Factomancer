import type { ControversyResult, VerifiedControversyResult } from './types.js'

function hostnameOf(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host.startsWith('www.') ? host.slice(4) : host
  } catch {
    return null
  }
}

function hostsMatch(a: string, b: string): boolean {
  return a === b || a.endsWith('.' + b) || b.endsWith('.' + a)
}

function isRetrieved(url: string | undefined, retrievedHosts: string[]): boolean {
  if (!url) return false
  const host = hostnameOf(url)
  return host !== null && retrievedHosts.some((r) => hostsMatch(host, r))
}

export function verifyControversyResult(
  result: ControversyResult,
  retrievedUrls: readonly string[],
): VerifiedControversyResult {
  const retrievedHosts: string[] = []
  for (const url of retrievedUrls) {
    const host = hostnameOf(url)
    if (host) retrievedHosts.push(host)
  }

  const verifiedSources = result.sources.filter((s) => isRetrieved(s.url, retrievedHosts))

  const basedOnModelKnowledge =
    verifiedSources.length === 0 &&
    (result.courtCases.length > 0 ||
      result.countryBans.length > 0 ||
      result.platformBans.length > 0 ||
      result.majorCritique.length > 0)

  return {
    ...result,
    sources: verifiedSources,
    ...(basedOnModelKnowledge ? { basedOnModelKnowledge: true } : {}),
  }
}
