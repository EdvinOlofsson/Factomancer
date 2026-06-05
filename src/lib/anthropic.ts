import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

/**
 * Shared Anthropic client singleton. Used by every AI command module.
 * Throws if the key is missing — call sites surface a friendly message.
 */
export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('Missing env var: ANTHROPIC_API_KEY')
    _client = new Anthropic({ apiKey })
  }
  return _client
}
