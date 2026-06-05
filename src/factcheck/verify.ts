import type { FactCheckResult, VerifiedFactCheckResult } from './types.js'

function hostnameOf(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host.startsWith('www.') ? host.slice(4) : host
  } catch {
    return null
  }
}

/**
 * True when two hostnames belong to the same site, tolerating subdomains
 * (`data.riksdagen.se` matches `riksdagen.se`). The leading dot guards against
 * look-alike domains: `evil-riksdagen.se` does NOT match `riksdagen.se`.
 */
function hostsMatch(a: string, b: string): boolean {
  return a === b || a.endsWith('.' + b) || b.endsWith('.' + a)
}

/**
 * Cross-check the model's claimed sources against the URLs actually retrieved
 * by web search. Fabricated sources (hostnames never retrieved) are dropped.
 * A factual verdict left with no real sources keeps its verdict but is flagged
 * as based on the model's own knowledge (Option B).
 */
export function verifyFactCheck(
  result: FactCheckResult,
  retrievedUrls: readonly string[],
): VerifiedFactCheckResult {
  const retrievedHosts: string[] = []
  for (const url of retrievedUrls) {
    const host = hostnameOf(url)
    if (host) retrievedHosts.push(host)
  }

  const verifiedSources = result.sources.filter((source) => {
    const host = hostnameOf(source.url)
    return host !== null && retrievedHosts.some((retrieved) => hostsMatch(host, retrieved))
  })

  const isFactual = result.verdict === 'supported' || result.verdict === 'disproven'

  if (isFactual && verifiedSources.length === 0) {
    return {
      verdict: result.verdict,
      caveat: "No sources retrieved — based on the model's own knowledge",
      explanation: result.explanation,
      sources: [],
      basedOnModelKnowledge: true,
    }
  }

  const verified: VerifiedFactCheckResult = {
    verdict: result.verdict,
    caveat: result.caveat,
    explanation: result.explanation,
    sources: verifiedSources,
  }

  if (result.educatedGuess !== undefined && result.verdict === 'no_evidence') {
    verified.educatedGuess = result.educatedGuess
  }

  return verified
}
