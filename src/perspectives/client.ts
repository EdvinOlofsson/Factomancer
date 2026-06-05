import type Anthropic from '@anthropic-ai/sdk'
import { getAnthropicClient } from '../lib/anthropic.js'
import { buildPerspectivesPrompt, buildPerspectivesUserMessage } from './prompt.js'

const MODEL = 'claude-sonnet-4-6'

export async function runPerspectives(topic: string): Promise<string> {
  const response = await getAnthropicClient().messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: buildPerspectivesPrompt(),
    messages: [{ role: 'user', content: buildPerspectivesUserMessage(topic) }],
  })

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
}
