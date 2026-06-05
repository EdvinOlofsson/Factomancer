import { z } from 'zod'

export const LENS_KEYS = ['left', 'right', 'libertarian', 'authoritarian'] as const
export type LensKey = (typeof LENS_KEYS)[number]

export const perspectivesSchema = z.object({
  left: z.string().min(1),
  right: z.string().min(1),
  libertarian: z.string().min(1),
  authoritarian: z.string().min(1),
})
export type PerspectivesResult = z.infer<typeof perspectivesSchema>
