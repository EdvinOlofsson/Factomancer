<!-- Generated: 2026-06-06 | Files scanned: 34 | Token estimate: ~300 -->
<!-- /factcheck uses web search ($10/1k searches); /perspectives uses no tools (tokens only, much cheaper) -->

# Dependencies & External Services

## Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `discord.js` | ^14.16.3 | Discord bot framework |
| `@anthropic-ai/sdk` | ^0.100.1 | Anthropic Messages API client |
| `dotenv` | ^16.4.5 | `.env` loading |
| `zod` | ^4.4.3 | Schema validation at API output boundaries |

## Dev Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | ^5.7.2 |
| `tsx` | Hot-reload dev runner + script runner |
| `vitest` | Unit test runner |
| `typescript-eslint` | Linting |

## External Services

| Service | Used for | Auth |
|---------|----------|------|
| Discord API | Slash commands, message delivery | `DISCORD_TOKEN` |
| Anthropic API | `claude-sonnet-4-6` + `web_search_20250305` | `ANTHROPIC_API_KEY` |

## Anthropic API Details
- Model: `claude-sonnet-4-6`
- Tool: `web_search_20250305` (not `20260209` — that requires `code_execution` tool)
- Cost: ~$0.07/call max (5 searches × $0.01 + ~$0.02 tokens)
- Budget: $5 loaded → ~71 calls at full utilisation
- Pricing: `$10 / 1000` web searches + standard Sonnet token rates

## Required Env Vars

```
DISCORD_TOKEN              — bot token (Bot → Token in Dev Portal)
CLIENT_ID                  — Application ID (General Information)
GUILD_ID                   — test server ID (right-click server → Copy ID)
ANTHROPIC_API_KEY          — from console.anthropic.com

# Optional — rate limiting defaults shown
RATE_LIMIT_PER_USER_HOUR=5
RATE_LIMIT_GLOBAL_DAILY=20
```
