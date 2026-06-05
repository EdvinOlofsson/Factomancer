<!-- Generated: 2026-06-06 | Files scanned: 34 | Token estimate: ~750 -->

# Factomancer — Architecture Overview

Single-process discord.js v14 bot. TypeScript, NodeNext ESM, pnpm.
No database. Two AI commands (`/factcheck`, `/perspectives`) built on a shared `src/lib/`.
External services: Discord API + Anthropic API only.

## Entry Points

```
src/index.ts          — bot process (pnpm dev / pnpm start)
src/deploy-commands.ts — one-shot slash command registration (pnpm deploy-commands)
src/eval/run.ts        — manual honesty eval for /factcheck (pnpm eval) — hits live API
```

## Shared Library (src/lib/)

```
lib/anthropic.ts     — getAnthropicClient(): single Anthropic client singleton
lib/json-extract.ts  — extractJsonCandidates(text), parseModelJson(text, schema)
```
Both AI command modules build on these — the foundation for adding command #3+.

## Request Flow — /factcheck (web search + verification)

```
commands/factcheck.ts
  checkRateLimit(userId)   → deny → ephemeral reply, return
  recordUsage → deferReply
  factcheck/index.ts factCheck()
    → client.ts runFactCheck()  ← Anthropic + web_search_20250305 (via lib/anthropic)
    → parse.ts                  ← lib/json-extract.parseModelJson + Zod
    → verify.ts                 ← cross-check sources vs retrieved URLs
  format.ts → editReply(embed) + log searches used
```

## Request Flow — /perspectives (synthesis, no web search)

```
commands/perspectives.ts
  checkRateLimit(userId)   → deny → ephemeral reply, return   (shared limiter)
  recordUsage → deferReply
  perspectives/index.ts generatePerspectives()
    → client.ts runPerspectives()  ← Anthropic, no tools (via lib/anthropic)
    → parse.ts                     ← lib/json-extract.parseModelJson + Zod
    null → friendly error; else format.ts → editReply(embed)
```

## Request Flow — /usage

```
commands/usage.ts → getUsageStats(userId) → reply (ephemeral)
```

## Module Dependency Graph

```
src/index.ts
  ├── commands/ping.ts
  ├── commands/factcheck.ts ──┬── factcheck/{index,client,parse,verify,format}.ts
  │                           └── factcheck/limiter.ts
  ├── commands/perspectives.ts ─┬── perspectives/{index,client,parse,format}.ts
  │                             └── factcheck/limiter.ts        (shared)
  └── commands/usage.ts ─────────── factcheck/limiter.ts        (shared)

src/lib/
  ├── anthropic.ts      ← factcheck/client.ts, perspectives/client.ts
  └── json-extract.ts   ← factcheck/parse.ts,  perspectives/parse.ts
```

## Key Invariants (vibe-coding constraints)

1. `deferReply()` is the first `await` on the allowed path of any AI command
2. `checkRateLimit()` (sync) runs before `deferReply()`; deny → `reply({ flags: MessageFlags.Ephemeral })`
3. `verify.ts` drops any factcheck source not in `retrievedUrls` before it reaches Discord
4. `basedOnModelKnowledge` is verifier-set only — never in the model-facing Zod schema
5. `educatedGuess` may only be set when `verdict === 'no_evidence'`
6. `/perspectives` never adjudicates which lens is correct; disclaimer footer always present
7. Ephemeral replies use `MessageFlags.Ephemeral` (not the deprecated `ephemeral: true`)

## Note
`factcheck/limiter.ts` is now shared by 3 commands — a candidate to relocate to `src/lib/` in a future cleanup.
