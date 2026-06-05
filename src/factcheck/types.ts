import { z } from 'zod'

export const verdictSchema = z.enum(['supported', 'disproven', 'no_evidence', 'opinion'])
export type Verdict = z.infer<typeof verdictSchema>

export const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
})
export type Source = z.infer<typeof sourceSchema>

export const factCheckResultSchema = z.object({
  verdict: verdictSchema,
  caveat: z.string().min(1),
  explanation: z.string().min(1),
  sources: z.array(sourceSchema),
  educatedGuess: z.string().optional(),
})
export type FactCheckResult = z.infer<typeof factCheckResultSchema>

/**
 * The verifier's output: a model result enriched with a derived flag.
 * `basedOnModelKnowledge` is set ONLY by the verifier (never by the model),
 * so it deliberately lives outside the model-facing schema.
 */
export type VerifiedFactCheckResult = FactCheckResult & {
  basedOnModelKnowledge?: boolean
}
