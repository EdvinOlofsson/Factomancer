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

export interface FactCheckRaw {
  text: string
  retrievedUrls: string[]
  searchesUsed: number
}

export async function runFactCheck(claim: string): Promise<FactCheckRaw> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
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

  // Collect the URLs web search actually retrieved, so the verifier can
  // distinguish real sources from ones the model may have fabricated.
  const retrievedUrls: string[] = []
  for (const block of response.content) {
    if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
      for (const item of block.content) {
        if (item.type === 'web_search_result') retrievedUrls.push(item.url)
      }
    }
  }

  const searchesUsed =
    (response.usage as { server_tool_use?: { web_search_requests?: number } })
      ?.server_tool_use?.web_search_requests ?? 0

  return { text, retrievedUrls, searchesUsed }
}
