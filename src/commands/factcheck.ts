import { SlashCommandBuilder } from 'discord.js'
import type { Command } from '../types.js'
import { factCheck } from '../factcheck/index.js'
import { formatFactCheckEmbed } from '../factcheck/format.js'

export const factcheckCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('factcheck')
    .setDescription('Fact-checks a claim using AI and real sources')
    .addStringOption((option) =>
      option
        .setName('claim')
        .setDescription('The claim to fact-check (max 500 characters)')
        .setRequired(true)
        .setMaxLength(500),
    ),
  async execute(interaction) {
    await interaction.deferReply()

    const claim = interaction.options.getString('claim', true)

    try {
      const result = await factCheck(claim)
      const embed = formatFactCheckEmbed(result, claim)
      await interaction.editReply({ embeds: [embed] })
    } catch (error) {
      console.error('[factcheck] Error:', error instanceof Error ? error.message : error)
      await interaction.editReply({
        content: '⚠️ An error occurred while fact-checking. Please try again.',
      })
    }
  },
}
