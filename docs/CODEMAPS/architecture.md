<!-- Generated: 2026-06-05 | Files scanned: 23 | Token estimate: ~600 -->

# Factomancer — Architecture Overview

Single-process discord.js v14 bot. TypeScript, NodeNext ESM, pnpm.
No database. No external services beyond Discord and Anthropic APIs.

## Entry Points

```
src/index.ts          — bot process (pnpm dev / pnpm start)
src/deploy-commands.ts — one-shot slash command registration (pnpm deploy-commands)
src/eval/run.ts        — manual honesty eval (pnpm eval) — hits live API
```

## Request Flow — /factcheck

```
Discord interaction
  → src/commands/factcheck.ts
      checkRateLimit(userId)        ← sync, in-memory
      if denied → ephemeral reply, return
      recordUsage(userId)
      deferReply()                  ← MUST be first async call on allowed path
      factCheck(claim)
        → client.ts: runFactCheck() ← Anthropic API (claude-sonnet-4-6 + web_search_20250305)
        → parse.ts: parseFactCheckResult()  ← balanced-brace JSON extraction + Zod
        → verify.ts: verifyFactCheck()      ← cross-check sources vs retrieved URLs
      formatFactCheckEmbed()        ← EmbedBuilder, colour-coded by verdict
      editReply({ embeds })
```

## Request Flow — /usage

```
Discord interaction
  → src/commands/usage.ts
      getUsageStats(userId)         ← sync read of in-memory limiter
      interaction.reply({ ephemeral: true })
```

## Module Dependency Graph

```
src/index.ts
  ├── commands/ping.ts
  ├── commands/factcheck.ts
  │     ├── factcheck/index.ts (factCheck)
  │     │     ├── factcheck/client.ts (runFactCheck)
  │     │     ├── factcheck/parse.ts (parseFactCheckResult)
  │     │     └── factcheck/verify.ts (verifyFactCheck)
  │     ├── factcheck/format.ts (formatFactCheckEmbed)
  │     └── factcheck/limiter.ts (checkRateLimit, recordUsage)
  └── commands/usage.ts
        └── factcheck/limiter.ts (getUsageStats)
```

## Key Invariants (vibe-coding constraints)

1. `deferReply()` must be the first `await` on the allowed path in any AI command
2. `checkRateLimit()` must run before `deferReply()` — it must be synchronous
3. `basedOnModelKnowledge` flag is verifier-set only, never in the model-facing Zod schema
4. Sources not in `retrievedUrls` are structurally dropped by verify.ts before reaching Discord
5. `educatedGuess` may only be set when `verdict === 'no_evidence'`
