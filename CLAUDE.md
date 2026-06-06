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
| `/perspectives <topic>` | Public | Four ideological lenses (left/right/libertarian/authoritarian) on any topic |
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

## Architecture Constraints (vibe-coding invariants — do not break silently)

1. **`deferReply()` first** — any command that calls the AI must `await interaction.deferReply()` as the very first async call on the allowed path. Discord kills un-acked interactions at 3 seconds.
2. **Rate limit before defer** — `checkRateLimit()` is synchronous and must run before `deferReply()`. If denied, use `interaction.reply({ ephemeral: true })` and `return`.
3. **Verifier owns the source list** — sources not present in the URLs actually retrieved by web search are dropped by `verify.ts` before reaching Discord. Never bypass this.
4. **`basedOnModelKnowledge` is verifier-only** — this flag must never appear in the model-facing Zod schema (`factCheckResultSchema`). Only `verifyFactCheck()` sets it.
5. **`educatedGuess` only under `no_evidence`** — enforced in both `parse.ts` and `verify.ts`. Any other verdict must have this field stripped.
6. **Deploy after adding commands** — Discord caches slash commands. New commands are invisible until `pnpm deploy-commands` runs.

## Architecture Docs

Token-lean codemaps for AI context loading — read these before making large changes:

- `docs/CODEMAPS/architecture.md` — system overview, data flow, invariants
- `docs/CODEMAPS/factcheck-pipeline.md` — the AI pipeline in detail
- `docs/CODEMAPS/commands.md` — command registration pattern, routing, rate limiting
- `docs/CODEMAPS/dependencies.md` — packages, env vars, cost model

## Testing

This repo follows TDD. Write tests before or alongside implementation — never after as an afterthought.

**Every new command module must have co-located unit tests** (`*.test.ts` next to the source file) covering at minimum:
- `parse.ts` — JSON extraction, malformed input fallback
- `verify.ts` — source URL cross-checking logic
- `format.ts` — embed field presence/absence based on data shape
- `prompt.ts` — correct user message construction

Exclude only the Anthropic API client (`client.ts`) — it makes real HTTP calls and is not unit-testable without mocking infrastructure this repo intentionally avoids.

Run tests with `pnpm test`. All tests must pass before committing.
