import { EmbedBuilder } from 'discord.js'
import type { VerifiedControversyResult, CourtCase, Ban, Critique } from './types.js'

function scoreLabel(score: number): string {
  if (score <= 2) return 'Low'
  if (score <= 4) return 'Moderate'
  if (score <= 6) return 'Elevated'
  if (score <= 8) return 'High'
  return 'Extreme'
}

function scoreColor(score: number): number {
  if (score <= 2) return 0x2ecc71 // green
  if (score <= 4) return 0xf1c40f // yellow
  if (score <= 6) return 0xe67e22 // orange
  if (score <= 8) return 0xe74c3c // red
  return 0x8e44ad              // purple
}

function formatCourtCases(cases: CourtCase[]): string {
  return cases
    .slice(0, 5)
    .map((c) => {
      const line = `**${c.jurisdiction}** — ${c.description} *(${c.status})*`
      return c.url ? `[${line}](${c.url})` : line
    })
    .join('\n')
}

function formatBans(bans: Ban[]): string {
  return bans
    .slice(0, 5)
    .map((b) => {
      const targets = b.targets.join(', ')
      const line = `**${targets}** — ${b.reason}`
      return b.url ? `[${line}](${b.url})` : line
    })
    .join('\n')
}

function formatCritique(critiques: Critique[]): string {
  return critiques
    .slice(0, 5)
    .map((c) => {
      const line = `**${c.group}** — ${c.critique}`
      return c.url ? `[${line}](${c.url})` : line
    })
    .join('\n')
}

export function formatControversyEmbed(
  result: VerifiedControversyResult,
  topic: string,
): EmbedBuilder {
  const label = scoreLabel(result.score)
  const embed = new EmbedBuilder()
    .setTitle(`${label} (${result.score}/10) — ${topic.slice(0, 100)}`)
    .setDescription(result.summary)
    .setColor(scoreColor(result.score))

  if (result.courtCases.length > 0) {
    embed.addFields({
      name: '⚖️ Court Cases',
      value: formatCourtCases(result.courtCases).slice(0, 1024),
    })
  }

  if (result.countryBans.length > 0) {
    embed.addFields({
      name: '🚫 Country Bans',
      value: formatBans(result.countryBans).slice(0, 1024),
    })
  }

  if (result.platformBans.length > 0) {
    embed.addFields({
      name: '📵 Platform Bans',
      value: formatBans(result.platformBans).slice(0, 1024),
    })
  }

  if (result.majorCritique.length > 0) {
    embed.addFields({
      name: '🗣️ Major Critique',
      value: formatCritique(result.majorCritique).slice(0, 1024),
    })
  }

  if (result.sources.length > 0) {
    const sourceLines = result.sources
      .slice(0, 5)
      .map((s, i) => `${i + 1}. [${s.title}](${s.url})`)
      .join('\n')
    embed.addFields({ name: 'Sources', value: sourceLines })
  }

  if (result.basedOnModelKnowledge) {
    embed.addFields({
      name: '⚠️ No sources retrieved',
      value: "Findings are based on the model's own knowledge, not retrieved sources.",
    })
  }

  return embed
}
