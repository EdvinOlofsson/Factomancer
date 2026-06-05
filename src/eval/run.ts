import 'dotenv/config'
import { factCheck } from '../factcheck/index.js'
import { goldenClaims } from './golden-claims.js'

/**
 * Manual honesty eval. Hits the live Anthropic API (costs credit) — run it
 * deliberately after prompt or verifier changes, NOT in CI:
 *   pnpm eval
 */
async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Missing env var: ANTHROPIC_API_KEY')
  }

  console.log(`Running ${goldenClaims.length} golden claims...\n`)
  let matches = 0

  for (const golden of goldenClaims) {
    const result = await factCheck(golden.claim)
    const ok = result.verdict === golden.expected
    if (ok) matches++

    console.log(`[${ok ? 'MATCH' : 'DIFF '}] expected=${golden.expected}  got=${result.verdict}`)
    console.log(`        claim:  ${golden.claim}`)
    console.log(`        caveat: ${result.caveat}`)
    console.log(`        sources: ${result.sources.length}${result.basedOnModelKnowledge ? ' (none retrieved — model knowledge)' : ''}`)
    console.log()
  }

  console.log(`${matches}/${goldenClaims.length} verdict categories matched (human judgment — not a hard gate).`)
}

main().catch((error) => {
  console.error('Eval failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
