import { SlashCommandBuilder } from 'discord.js'
import type { Command } from '../types.js'

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong! and shows latency'),
  async execute(interaction) {
    const latency = Date.now() - interaction.createdTimestamp
    await interaction.reply(`Pong! Latency: ${latency}ms`)
  },
}
