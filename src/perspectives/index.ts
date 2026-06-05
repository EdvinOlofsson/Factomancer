import { runPerspectives } from './client.js'
import { parsePerspectives } from './parse.js'
import type { PerspectivesResult } from './types.js'

export async function generatePerspectives(topic: string): Promise<PerspectivesResult | null> {
  const text = await runPerspectives(topic)
  return parsePerspectives(text)
}
