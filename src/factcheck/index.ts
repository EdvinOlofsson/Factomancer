import { parseFactCheckResult } from './parse.js'
import { runFactCheck } from './client.js'
import { verifyFactCheck } from './verify.js'
import type { VerifiedFactCheckResult } from './types.js'

export interface FactCheckOutcome {
  result: VerifiedFactCheckResult
  searchesUsed: number
}

export async function factCheck(claim: string): Promise<FactCheckOutcome> {
  const { text, retrievedUrls, searchesUsed } = await runFactCheck(claim)
  const parsed = parseFactCheckResult(text)
  return { result: verifyFactCheck(parsed, retrievedUrls), searchesUsed }
}
