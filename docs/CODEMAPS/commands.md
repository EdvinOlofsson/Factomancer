<!-- Generated: 2026-06-05 | Files scanned: 23 | Token estimate: ~400 -->

# Commands & Registration

## Registered Commands

| Command | File | Scope | Notes |
|---------|------|-------|-------|
| `/ping` | `src/commands/ping.ts` | Public | Latency check, no AI |
| `/factcheck <claim>` | `src/commands/factcheck.ts` | Public | Rate-limited; 500 char max |
| `/usage` | `src/commands/usage.ts` | Ephemeral | Quota display |

## Command Interface (src/types.ts)

```ts
interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder
  execute(interaction: ChatInputCommandInteraction): Promise<void>
}
```

`SlashCommandOptionsOnlyBuilder` is the return type of `addStringOption()` etc. — use the
union when a command adds options.

## Registration Pattern

Every new command requires changes in **three files**:

```
src/commands/<name>.ts       — implement Command interface
src/index.ts                 — commands.set(cmd.data.name, cmd)
src/deploy-commands.ts       — commands array push cmd.data.toJSON()
```

Then run `pnpm deploy-commands` to push to Discord's API. Discord caches commands — the
new command will not appear until deploy-commands runs.

## Event Routing (src/events/interactionCreate.ts)

```
Interaction received
  → isChatInputCommand() guard
  → commands.get(interaction.commandName)
  → command.execute(interaction).catch(console.error)
```

## Rate Limiting (src/factcheck/limiter.ts)

Applied in `factcheck.ts` only. Pattern for any future AI command:

```ts
const limit = checkRateLimit(interaction.user.id)   // synchronous
if (!limit.allowed) {
  await interaction.reply({ content: `⏱️ ${limit.reason}`, ephemeral: true })
  return
}
recordUsage(interaction.user.id)
await interaction.deferReply()   // ← ALWAYS after the rate-limit check
```

Defaults: 5 calls/user/hour, 20 calls/day global. Override via `.env`.
