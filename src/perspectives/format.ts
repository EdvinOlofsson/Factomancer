import { EmbedBuilder } from 'discord.js'
import type { PerspectivesResult } from './types.js'

const PERSPECTIVES_COLOR = 0x9b59b6

function field(name: string, value: string): { name: string; value: string } {
  return { name, value: value.slice(0, 1024) }
}

export function formatPerspectivesEmbed(
  result: PerspectivesResult,
  topic: string,
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`🧭 Perspectives: ${topic.slice(0, 240)}`)
    .setColor(PERSPECTIVES_COLOR)
    .addFields(
      field('⬅️ Left', result.left),
      field('➡️ Right', result.right),
      field('🗽 Libertarian', result.libertarian),
      field('🏛️ Authoritarian', result.authoritarian),
    )
    .setFooter({
      text: 'Characterisations of ideological perspectives — not facts or official party positions.',
    })
}
