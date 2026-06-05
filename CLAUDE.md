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
| `pnpm eval` | Manual honesty eval against 8 golden claims (hits live API) |
| `pnpm deploy-commands` | Register slash commands with Discord API |

## Setup

1. Copy `.env.example` to `.env` and fill in your bot credentials
2. Run `pnpm install`
3. Run `pnpm deploy-commands` once to register slash commands with your test server
4. Run `pnpm dev` to start the bot

## Slash Commands

| Command | Visibility | Purpose |
|---------|-----------|---------|
| `/ping` | Public | Latency check |
| `/factcheck <claim>` | Public | AI fact-check with web search and source verification |
| `/usage` | Ephemeral (you only) | Show remaining quota for you and the server |

## Rate Limiting

`/factcheck` is rate-limited to protect the Anthropic API budget:

| Limit | Default | Override via `.env` |
|-------|---------|---------------------|
| Per user | 5 calls / hour | `RATE_LIMIT_PER_USER_HOUR=5` |
| Global | 20 calls / day | `RATE_LIMIT_GLOBAL_DAILY=20` |

Limits are in-memory and reset on bot restart. The daily limit resets at midnight UTC.
At max usage (~$0.07/call), the daily limit costs ≤ $1.40/day. Monitor spend at `console.anthropic.com`.

Each successful `/factcheck` logs `[factcheck] searches used: N` to the `pnpm dev` console — watch this to spot expensive claims.

## Project Structure

```
src/
  index.ts                  — entry point, wires client + events
  types.ts                  — shared Command interface
  deploy-commands.ts        — one-shot slash command registration script
  commands/
    ping.ts                 — /ping command
    factcheck.ts            — /factcheck command (rate limit check → AI pipeline)
    usage.ts                — /usage command (quota display)
  events/
    ready.ts                — ClientReady handler
    interactionCreate.ts    — routes slash commands to handlers
  factcheck/
    index.ts                — orchestrator: client → parse → verify
    client.ts               — Anthropic API call (web_search tool)
    parse.ts                — extracts + validates JSON from model text
    verify.ts               — cross-checks sources vs retrieved URLs
    format.ts               — VerifiedFactCheckResult → Discord embed
    prompt.ts               — system prompt (anti-fabrication, source tiering)
    limiter.ts              — in-memory rate limiter
    types.ts                — shared types + Zod schemas
  eval/
    golden-claims.ts        — 8 curated test claims
    run.ts                  — pnpm eval entry point
```

## Adding a New Command

1. Create `src/commands/<name>.ts` implementing the `Command` interface
2. Import and register it in `src/index.ts` and `src/deploy-commands.ts`
3. Run `pnpm deploy-commands` to push it to Discord
