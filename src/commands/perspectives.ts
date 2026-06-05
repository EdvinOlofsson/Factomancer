import { MessageFlags, SlashCommandBuilder } from 'discord.js'
import type { Command } from '../types.js'
import { generatePerspectives } from '../perspectives/index.js'
import { formatPerspectivesEmbed } from '../perspectives/format.js'
import { checkRateLimit, recordUsage } from '../factcheck/limiter.js'

export const perspectivesCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('perspectives')
    .setDescription('Shows how four ideological lenses frame a topic')
    .addStringOption((option) =>
      option
        .setName('topic')
        .setDescription('The topic to view through four ideological lenses (max 300 characters)')
        .setRequired(true)
        .setMaxLength(300),
    ),
  async execute(interaction) {
    const userId = interaction.user.id
    const limit = checkRateLimit(userId)

    if (!limit.allowed) {
      await interaction.reply({ content: `⏱️ ${limit.reason}`, flags: MessageFlags.Ephemeral })
      return
    }

    recordUsage(userId)
    await interaction.deferReply()

    const topic = interaction.options.getString('topic', true)

    try {
      const result = await generatePerspectives(topic)
      if (!result) {
        await interaction.editReply({
          content: '🤔 Could not generate perspectives for that topic. Try rephrasing.',
        })
        return
      }
      const embed = formatPerspectivesEmbed(result, topic)
      await interaction.editReply({ embeds: [embed] })
    } catch (error) {
      console.error('[perspectives] Error:', error instanceof Error ? error.message : error)
      await interaction.editReply({
        content: '⚠️ An error occurred while generating perspectives. Please try again.',
      })
    }
  },
}
