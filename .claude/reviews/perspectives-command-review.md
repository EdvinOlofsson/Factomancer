# Code Review: /perspectives Command + Shared AI Lib

**Reviewed**: 2026-06-06
**Scope**: `src/lib/` extraction, factcheck refactor, `src/perspectives/` module, command + registration
**Decision**: APPROVE (0 critical, 0 high, 0 medium, 2 low — both fixed)

## Summary
Clean, well-tested milestone. The shared-lib extraction is behaviour-preserving (all existing factcheck suites stayed green), and the perspectives module faithfully mirrors the established factcheck structure. The intensity/floor handling in the prompt is well-judged. Two low findings, both fixed in this pass.

---

## Findings

### CRITICAL
None.

### HIGH
None.

### MEDIUM
None.

### LOW

**L1 — `ephemeral: true` is deprecated in discord.js v14.26** — ✅ FIXED
All three commands (`factcheck.ts`, `usage.ts`, `perspectives.ts`) used the `ephemeral: true` reply option, deprecated since discord.js v14.21 in favour of `flags: MessageFlags.Ephemeral`. Works today but logs a deprecation warning. Updated all three to the modern form for consistency.

**L2 — `result.explanation` uncapped in the factcheck embed description** (carried over from Milestone 2 review) — ✅ FIXED
Discord embed descriptions cap at 4096 chars; `claim` was capped but `explanation` was not. Added `.slice(0, 3500)` defensive cap (leaves headroom for the claim prefix).

---

## Notes (no action needed)

- **Model output in perspectives embed fields** — lens text is model-generated and placed in embed fields without markdown escaping. Low risk on a private trusted server; consistent with the factcheck approach. Accepted.
- **Prompt injection via topic** — a crafted topic could try to subvert the lens structure, but the parser requires all four lenses or returns null → friendly error. Injection degrades to a failed generation, not harmful output. The prompt floor handles harmful-content attempts. Accepted for private use.
- **Shared daily quota** — `/perspectives` and `/factcheck` share the limiter by design (cost not a concern). Splittable later if needed.

## Validation Results

| Check | Result |
|---|---|
| `pnpm typecheck` | ✅ Pass |
| `pnpm lint` | ✅ Pass |
| `pnpm test` (82 tests) | ✅ Pass |
| `pnpm build` | ✅ Pass |

## Files Reviewed

| File | Type |
|---|---|
| `src/lib/anthropic.ts` | Added |
| `src/lib/json-extract.ts` | Added |
| `src/lib/json-extract.test.ts` | Added |
| `src/factcheck/client.ts` | Modified (use shared client) |
| `src/factcheck/parse.ts` | Modified (use shared parseModelJson) |
| `src/factcheck/limiter.ts` | Modified (generalised wording) |
| `src/factcheck/format.ts` | Modified (L2 cap fix) |
| `src/commands/factcheck.ts` | Modified (L1 ephemeral fix) |
| `src/commands/usage.ts` | Modified (L1 ephemeral fix) |
| `src/perspectives/*.ts` (7 files) | Added |
| `src/perspectives/*.test.ts` (3 files) | Added |
| `src/commands/perspectives.ts` | Added |
| `src/index.ts` | Modified (register command) |
| `src/deploy-commands.ts` | Modified (register command) |
| `CLAUDE.md` | Modified (command table) |
