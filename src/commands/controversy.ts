import { SlashCommandBuilder } from 'discord.js'
import type { Command } from '../types.js'
import { checkControversy } from '../controversy/index.js'
import { formatControversyEmbed } from '../controversy/format.js'

export const controversyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('controversy')
    .setDescription('Checks how controversial a person or topic is')
    .addStringOption((option) =>
      option
        .setName('topic')
        .setDescription('Person or topic to investigate (max 200 characters)')
        .setRequired(true)
        .setMaxLength(200),
    ),
  async execute(interaction) {
    await interaction.deferReply()

    const topic = interaction.options.getString('topic', true)

    try {
      const result = await checkControversy(topic)
      const embed = formatControversyEmbed(result, topic)
      await interaction.editReply({ embeds: [embed] })
    } catch (error) {
      console.error('[controversy] Error:', error instanceof Error ? error.message : error)
      await interaction.editReply({
        content: '⚠️ An error occurred while checking controversy. Please try again.',
      })
    }
  },
}
