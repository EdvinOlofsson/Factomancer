import { Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import 'dotenv/config'
import type { Command } from './types.js'
import { pingCommand } from './commands/ping.js'
import { factcheckCommand } from './commands/factcheck.js'
import { readyEvent } from './events/ready.js'
import { interactionCreateEvent } from './events/interactionCreate.js'

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const commands = new Collection<string, Command>()
commands.set(pingCommand.data.name, pingCommand)
commands.set(factcheckCommand.data.name, factcheckCommand)

client.once(Events.ClientReady, readyEvent.execute)
client.on(Events.InteractionCreate, (interaction) =>
  interactionCreateEvent.execute(interaction, commands),
)

await client.login(process.env.DISCORD_TOKEN)
