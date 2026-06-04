# Discord Bot

Personal Discord bot built with discord.js v14 and TypeScript.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Run with hot reload (tsx watch) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled bot from `dist/` |
| `pnpm typecheck` | Type-check without emitting |
| `pnpm lint` | ESLint across `src/` |
| `pnpm test` | Vitest unit tests |
| `pnpm deploy-commands` | Register slash commands with Discord API |

## Setup

1. Copy `.env.example` to `.env` and fill in your bot credentials
2. Run `pnpm install`
3. Run `pnpm deploy-commands` once to register slash commands with your test server
4. Run `pnpm dev` to start the bot

## Project Structure

```
src/
  index.ts              — entry point, wires client + events
  types.ts              — shared Command interface
  deploy-commands.ts    — one-shot slash command registration script
  commands/
    ping.ts             — example slash command
  events/
    ready.ts            — ClientReady handler
    interactionCreate.ts — routes slash commands to handlers
```

## Adding a New Command

1. Create `src/commands/<name>.ts` implementing the `Command` interface
2. Import and register it in `src/index.ts`
3. Run `pnpm deploy-commands` to push it to Discord
