import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, buildUserMessage } from './prompt.js'

const MODEL = 'claude-sonnet-4-6'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('Missing env var: ANTHROPIC_API_KEY')
    _client = new Anthropic({ apiKey })
  }
  return _client
}

export async function runFactCheck(claim: string): Promise<string> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserMessage(claim) }],
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 5,
        user_location: {
          type: 'approximate',
          country: 'SE',
          timezone: 'Europe/Stockholm',
        },
      },
    ],
  })

  // Concatenate all text blocks — the JSON verdict may not be in the last one
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')

  return text
}
