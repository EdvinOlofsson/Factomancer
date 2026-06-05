import { EmbedBuilder } from 'discord.js'
import type { VerifiedFactCheckResult, Verdict } from './types.js'

const VERDICT_CONFIG: Record<Verdict, { color: number; label: string }> = {
  supported: { color: 0x2ecc71, label: '✅ Supported' },
  disproven: { color: 0xe74c3c, label: '❌ Disproven' },
  no_evidence: { color: 0x95a5a6, label: '🔍 No solid evidence' },
  opinion: { color: 0xf39c12, label: '💭 Opinion — not factually checkable' },
}

export function formatFactCheckEmbed(
  result: VerifiedFactCheckResult,
  claim: string,
): EmbedBuilder {
  const config = VERDICT_CONFIG[result.verdict]

  const embed = new EmbedBuilder()
    .setTitle(config.label)
    .setDescription(`**Claim:** *${claim.slice(0, 256)}*\n\n${result.explanation}`)
    .setColor(config.color)
    .setFooter({ text: `Confidence: ${result.caveat}` })

  if (result.sources.length > 0) {
    const sourceLines = result.sources
      .slice(0, 5)
      .map((s, i) => `${i + 1}. [${s.title}](${s.url})`)
      .join('\n')
    embed.addFields({ name: 'Sources', value: sourceLines })
  }

  if (result.basedOnModelKnowledge) {
    embed.addFields({
      name: '⚠️ No sources found',
      value: "This verdict is based on the model's own knowledge, not retrieved sources.",
    })
  }

  if (result.educatedGuess) {
    embed.addFields({
      name: '📝 Educated guess (unverified)',
      value: `⚠️ Unverified — not a fact-check. ${result.educatedGuess}`.slice(0, 1024),
    })
  }

  return embed
}
