import { MessageFlags, SlashCommandBuilder } from 'discord.js'
import type { Command } from '../types.js'
import { getUsageStats } from '../factcheck/limiter.js'

export const usageCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('usage')
    .setDescription('Shows remaining fact-check quota for you and the server today'),
  async execute(interaction) {
    const stats = getUsageStats(interaction.user.id)
    const userRemaining = Math.max(0, stats.userCallsHourLimit - stats.userCallsThisHour)
    const globalRemaining = Math.max(0, stats.globalDailyLimit - stats.globalCallsToday)

    const lines = [
      `**Your usage this hour:** ${stats.userCallsThisHour} / ${stats.userCallsHourLimit} (${userRemaining} remaining)`,
      `**Server usage today:** ${stats.globalCallsToday} / ${stats.globalDailyLimit} (${globalRemaining} remaining)`,
      `**Web searches today:** ${stats.totalSearchesToday}`,
      ``,
      `-# Limits reset: your quota hourly, server quota at midnight UTC.`,
    ]

    await interaction.reply({ content: lines.join('\n'), flags: MessageFlags.Ephemeral })
  },
}
