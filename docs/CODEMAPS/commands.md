<!-- Generated: 2026-06-06 | Files scanned: 34 | Token estimate: ~450 -->

# Commands & Registration

## Registered Commands

| Command | File | Scope | Notes |
|---------|------|-------|-------|
| `/ping` | `src/commands/ping.ts` | Public | Latency check, no AI |
| `/factcheck <claim>` | `src/commands/factcheck.ts` | Public | Rate-limited; web search + source verification; 500 char max |
| `/perspectives <topic>` | `src/commands/perspectives.ts` | Public | Rate-limited; four ideological lenses; no web search; 300 char max |
| `/usage` | `src/commands/usage.ts` | Ephemeral | Quota display |

## Command Interface (src/types.ts)

```ts
interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder
  execute(interaction: ChatInputCommandInteraction): Promise<void>
}
```

## Registration Pattern (three files)

```
src/commands/<name>.ts    — implement Command interface
src/index.ts              — commands.set(cmd.data.name, cmd)
src/deploy-commands.ts    — commands array push cmd.data.toJSON()
```
Then `pnpm deploy-commands` to push to Discord (commands are cached — invisible until deployed).

## AI Command Template (the shared shape)

Both `/factcheck` and `/perspectives` follow this exactly:

```ts
const limit = checkRateLimit(interaction.user.id)   // synchronous
if (!limit.allowed) {
  await interaction.reply({ content: `⏱️ ${limit.reason}`, flags: MessageFlags.Ephemeral })
  return
}
recordUsage(interaction.user.id)
await interaction.deferReply()                       // ← always after the rate-limit check
// ... call the module's generate/factCheck function
// ... null/empty → friendly editReply; else editReply({ embeds: [embed] })
// catch → console.error(message) + friendly editReply
```

New AI commands reuse `src/factcheck/limiter.ts` and `src/lib/`.

## Event Routing (src/events/interactionCreate.ts)

```
Interaction → isChatInputCommand() → commands.get(name) → command.execute().catch(console.error)
```

## Rate Limiting (src/factcheck/limiter.ts — shared)

Defaults: 5 calls/user/hour, 20 calls/day global (shared across all AI commands).
Override via `RATE_LIMIT_PER_USER_HOUR` / `RATE_LIMIT_GLOBAL_DAILY`. In-memory; resets on restart.
