# Code Review: Factomancer — Milestone 1

**Reviewed**: 2026-06-05
**Scope**: All new and modified files for /factcheck command
**Decision**: APPROVE with comments (0 critical, 0 high, 3 medium, 3 low)

## Summary
The implementation is clean, well-structured, and the TDD approach paid off — the honesty-critical parse/prompt/format modules are all covered. No security vulnerabilities or correctness bugs found. Three medium findings worth addressing before Milestone 2.

---

## Findings

### CRITICAL
None.

### HIGH
None.

### MEDIUM

**M1 — `parse.ts:16` — greedy regex can grab the wrong JSON object**
The pattern `\{[\s\S]*\}` is maximally greedy. If the model ever returns two JSON-like objects (e.g. an example in its thinking text and the actual verdict), it matches from the first `{` to the last `}`, producing invalid JSON that falls through to the catch block and triggers the fallback unnecessarily.

*Suggested fix*: Use a non-greedy match (`\{[\s\S]*?\}`) combined with trying each candidate, or anchor the search to the last `{...}` block via `lastIndexOf`.

**M2 — `client.ts` — module-level mutable singleton**
`let _client: Anthropic | null = null` is module-level mutable state. Fine for a small single-process bot, but if tests ever exercise `client.ts` directly they'll share the instance across test cases, and if `ANTHROPIC_API_KEY` is absent during early import it silently defers the error to first call.

*Suggested fix*: Instantiate the client once at module load (after the env guard) rather than lazily:
```ts
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) throw new Error('Missing env var: ANTHROPIC_API_KEY')
const anthropic = new Anthropic({ apiKey })
```
This surfaces the missing-key error at startup, not mid-request.

**M3 — `factcheck.ts` — catch block swallows all errors identically**
The catch in `execute()` logs the error and replies with a generic message. This is correct for user-facing output, but `console.error` is the only signal — if the Anthropic API returns a structured error (rate limit, quota exceeded) it's indistinguishable from a network timeout in the logs.

*Suggested fix*: Narrow the error type for known Anthropic SDK errors and include the error code in the console output:
```ts
console.error('[factcheck] Error:', error instanceof Error ? error.message : error)
```

---

### LOW

**L1 — `prompt.ts:44` — claim injected without sanitisation**
`buildUserMessage` wraps the claim in double quotes: `"Fact-check this claim: "${claim}""`. A claim containing a double-quote breaks the string visually (though it's still valid since this is a template literal, not JSON). No injection risk here (it's a prompt string, not SQL/HTML), but worth noting for future prompt formats.

**L2 — `format.ts:16` — `explanation` not length-capped**
`claim` is capped at 256 chars. `result.explanation` is not. Discord embed descriptions have a 4096-character limit; a runaway explanation could hit it. Low risk since the model is instructed to write 1–2 sentences, but a `.slice(0, 1000)` guard would be defensive.

**L3 — `.env.example` missing `ANTHROPIC_API_KEY` at the top**
`ANTHROPIC_API_KEY` was appended at the bottom, after the Discord credentials. New contributors following the setup guide will miss it if they stop reading early. Minor reorder: put it alongside the other keys with a comment.

---

## Validation Results

| Check | Result |
|---|---|
| `pnpm typecheck` | ✅ Pass |
| `pnpm lint` | ✅ Pass |
| `pnpm test` (28 tests) | ✅ Pass |
| Manual smoke test | ✅ Pass (verified by user — correct Swedish verdict, source tiering working) |

## Files Reviewed

| File | Type |
|---|---|
| `src/factcheck/types.ts` | Added |
| `src/factcheck/parse.ts` | Added |
| `src/factcheck/parse.test.ts` | Added |
| `src/factcheck/prompt.ts` | Added |
| `src/factcheck/prompt.test.ts` | Added |
| `src/factcheck/format.ts` | Added |
| `src/factcheck/format.test.ts` | Added |
| `src/factcheck/client.ts` | Added |
| `src/factcheck/index.ts` | Added |
| `src/commands/factcheck.ts` | Added |
| `src/types.ts` | Modified (widened Command.data union) |
| `src/index.ts` | Modified (registered factcheckCommand) |
| `src/deploy-commands.ts` | Modified (added factcheckCommand to deploy array) |
