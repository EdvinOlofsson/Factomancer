import { Events } from 'discord.js'
import type { Collection, Interaction } from 'discord.js'
import type { Command } from '../types.js'

export const interactionCreateEvent = {
  name: Events.InteractionCreate,
  execute(interaction: Interaction, commands: Collection<string, Command>): void {
    if (!interaction.isChatInputCommand()) return
    const command = commands.get(interaction.commandName)
    if (!command) return
    command.execute(interaction).catch(console.error)
  },
}
