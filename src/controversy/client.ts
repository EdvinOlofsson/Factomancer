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

export interface ControversyRaw {
  text: string
  retrievedUrls: string[]
}

export async function runControversyCheck(topic: string): Promise<ControversyRaw> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 3072,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserMessage(topic) }],
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 8,
        user_location: {
          type: 'approximate',
          country: 'SE',
          timezone: 'Europe/Stockholm',
        },
      },
    ],
  })

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')

  const retrievedUrls: string[] = []
  for (const block of response.content) {
    if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
      for (const item of block.content) {
        if (item.type === 'web_search_result') retrievedUrls.push(item.url)
      }
    }
  }

  return { text, retrievedUrls }
}
