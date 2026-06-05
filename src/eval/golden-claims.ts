import type { Verdict } from '../factcheck/types.js'

export interface GoldenClaim {
  claim: string
  expected: Verdict
  note: string
}

/**
 * A small curated set for manually checking that prompt/verifier changes don't
 * regress honesty behaviour. Verdict categories are judgment calls — the eval
 * reports them for human review, it does not hard-gate.
 */
export const goldenClaims: GoldenClaim[] = [
  { claim: 'Riksdagen har 349 ledamöter', expected: 'supported', note: 'fixed, checkable number' },
  { claim: 'Sverige har EU:s högsta bensinskatt', expected: 'disproven', note: 'other EU countries are higher' },
  { claim: 'Det svenska riksdagsvalet 2026 hålls i september', expected: 'supported', note: 'election date' },
  { claim: 'Sänkt bensinskatt är bra för Sverige', expected: 'opinion', note: 'value judgment' },
  { claim: 'Sverigedemokraterna kommer att vinna valet 2026', expected: 'opinion', note: 'prediction' },
  { claim: 'Den tredje riksdagskandidaten i Vimmerby heter Sven Svensson', expected: 'no_evidence', note: 'obscure, unverifiable' },
  { claim: 'Sweden abolished its monarchy in 2024', expected: 'disproven', note: 'false claim, English input' },
  { claim: 'The Swedish Riksdag uses a 4% parliamentary threshold', expected: 'supported', note: 'true, English input' },
]
