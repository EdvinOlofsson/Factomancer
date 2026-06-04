import { parseFactCheckResult } from './parse.js'
import { runFactCheck } from './client.js'
import type { FactCheckResult } from './types.js'

export async function factCheck(claim: string): Promise<FactCheckResult> {
  const text = await runFactCheck(claim)
  return parseFactCheckResult(text)
}
