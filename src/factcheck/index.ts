import { parseFactCheckResult } from './parse.js'
import { runFactCheck } from './client.js'
import { verifyFactCheck } from './verify.js'
import type { VerifiedFactCheckResult } from './types.js'

export async function factCheck(claim: string): Promise<VerifiedFactCheckResult> {
  const { text, retrievedUrls } = await runFactCheck(claim)
  const parsed = parseFactCheckResult(text)
  return verifyFactCheck(parsed, retrievedUrls)
}
