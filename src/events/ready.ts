import { Events } from 'discord.js'
import type { Client } from 'discord.js'

export const readyEvent = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client<true>): void {
    console.log(`Ready! Logged in as ${client.user.tag}`)
  },
}
