import { parseModelJson } from '../lib/json-extract.js'
import { perspectivesSchema, type PerspectivesResult } from './types.js'

/**
 * Returns the four perspectives, or null if the model output could not be
 * parsed into all four lenses (the command shows a friendly error on null).
 */
export function parsePerspectives(text: string): PerspectivesResult | null {
  return parseModelJson(text, perspectivesSchema)
}
