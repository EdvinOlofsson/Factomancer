import { REST, Routes } from 'discord.js'
import 'dotenv/config'
import { pingCommand } from './commands/ping.js'
import { factcheckCommand } from './commands/factcheck.js'
import { usageCommand } from './commands/usage.js'
import { perspectivesCommand } from './commands/perspectives.js'
import { controversyCommand } from './commands/controversy.js'

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error('Missing env vars: DISCORD_TOKEN, CLIENT_ID, GUILD_ID')
}

const commands = [
  pingCommand.data.toJSON(),
  factcheckCommand.data.toJSON(),
  usageCommand.data.toJSON(),
  perspectivesCommand.data.toJSON(),
  controversyCommand.data.toJSON(),
]
const rest = new REST().setToken(DISCORD_TOKEN)

console.log(`Registering ${commands.length} slash command(s)...`)
await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
console.log('Done.')
