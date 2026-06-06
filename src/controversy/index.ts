import { runControversyCheck } from './client.js'
import { parseControversyResult } from './parse.js'
import { verifyControversyResult } from './verify.js'
import type { VerifiedControversyResult } from './types.js'

export async function checkControversy(topic: string): Promise<VerifiedControversyResult> {
  const { text, retrievedUrls } = await runControversyCheck(topic)
  const parsed = parseControversyResult(text)
  return verifyControversyResult(parsed, retrievedUrls)
}
