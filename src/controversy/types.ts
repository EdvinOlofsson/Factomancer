import { z } from 'zod'

export const controversySourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
})
export type ControversySource = z.infer<typeof controversySourceSchema>

export const courtCaseSchema = z.object({
  description: z.string().min(1),
  jurisdiction: z.string().min(1),
  status: z.string().min(1),
  url: z.string().optional(),
})
export type CourtCase = z.infer<typeof courtCaseSchema>

export const banSchema = z.object({
  targets: z.array(z.string().min(1)).min(1),
  reason: z.string().min(1),
  url: z.string().optional(),
})
export type Ban = z.infer<typeof banSchema>

export const critiqueSchema = z.object({
  group: z.string().min(1),
  critique: z.string().min(1),
  url: z.string().optional(),
})
export type Critique = z.infer<typeof critiqueSchema>

export const controversyResultSchema = z.object({
  score: z.number().int().min(1).max(10),
  summary: z.string().min(1),
  courtCases: z.array(courtCaseSchema),
  countryBans: z.array(banSchema),
  platformBans: z.array(banSchema),
  majorCritique: z.array(critiqueSchema),
  sources: z.array(controversySourceSchema),
})
export type ControversyResult = z.infer<typeof controversyResultSchema>

export type VerifiedControversyResult = ControversyResult & {
  basedOnModelKnowledge?: boolean
}
