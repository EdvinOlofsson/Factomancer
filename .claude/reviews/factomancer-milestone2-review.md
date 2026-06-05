# Code Review: Factomancer — Milestone 2 (Honesty Hardening)

**Reviewed**: 2026-06-05
**Scope**: Verifier layer, parser robustness, client URL extraction, prompt hardening, format disclaimers, eval harness, M2/M3 fixes
**Decision**: APPROVE (0 critical, 0 high, 2 medium — both fixed, 4 low)

## Summary
Strong milestone. The verification layer turns the honesty guarantee from a prompt request into tested code, and the new tests (28 → 47) cover the honesty-critical paths well. No security or correctness defects that block. Both medium findings were fixed in this review pass (see resolution notes).

---

## Findings

### CRITICAL
None.

### HIGH
None.

### MEDIUM

**M1 — `verify.ts` `hostnameOf` — exact hostname match can drop legitimate subdomain sources** — ✅ FIXED (added `hostsMatch` suffix matching + tests for subdomain match and look-alike rejection)
After stripping `www.`, matching is exact. If the model cites `https://riksdagen.se/...` but web search returned `https://data.riksdagen.se/...` (or vice versa), the hostnames differ (`riksdagen.se` ≠ `data.riksdagen.se`) and the real source is dropped — which can then mis-trigger the `basedOnModelKnowledge` flag on a genuinely sourced verdict. Swedish government/stats sites use subdomains (`data.riksdagen.se`, `www.scb.se`), so this is realistic.

*Suggested fix*: match on registrable domain or allow a suffix match — treat hostnames as matching when one ends with `.<other>` (or they're equal):
```ts
function hostsMatch(a: string, b: string): boolean {
  return a === b || a.endsWith('.' + b) || b.endsWith('.' + a)
}
```
Apply it in the `verifiedSources` filter instead of `Set.has`.

**M2 — `client.ts` `max_tokens: 1024` — risk of truncating the final JSON on multi-search claims** — ✅ FIXED (raised to 2048)
With the web_search tool, the model's intermediate "I'll search for…" text and reasoning count toward output tokens *in addition to* the final JSON. A claim that triggers several search rounds could exhaust 1024 tokens before the closing `}`, producing truncated JSON → `SAFE_FALLBACK` (an unnecessary "couldn't process" reply). The claims tested so far fit, but it's a latent failure.

*Suggested fix*: raise to `max_tokens: 2048`. Cheap insurance; output is still bounded.

---

### LOW

**L1 — `format.ts` — `result.explanation` not length-capped in the description** (carried over from Milestone 1 review)
`claim` is capped at 256; `explanation` is interpolated raw. Discord's embed description limit is 4096. The model is told to write 1–2 sentences so the risk is low, but a `.slice()` guard would be defensive.

**L2 — `format.ts` — user claim interpolated into embed markdown without escaping**
`*${claim}*` places raw user input into markdown. A claim containing markdown could alter rendering. Risk is low on a private 4-person server, but worth noting for the trust boundary.

**L3 — Prompt injection via the claim can influence verdict/explanation (bounded)**
A crafted claim could try to steer the verdict. Note this is *defense-in-depth done right*: even if the prompt is subverted, the verifier still strips any source the API didn't actually retrieve, so a fabricated citation cannot reach the user. Acceptable for trusted private use; no action needed.

**L4 — `src/index.ts` — startup guard checks `ANTHROPIC_API_KEY` but not `DISCORD_TOKEN`**
`client.login()` fails clearly enough on a missing token, but guarding both at startup would be symmetric.

---

## Validation Results

| Check | Result |
|---|---|
| `pnpm typecheck` | ✅ Pass |
| `pnpm lint` | ✅ Pass |
| `pnpm test` (45 tests) | ✅ Pass |
| `pnpm build` | ✅ Pass |
| Live smoke test | ✅ Pass (user-confirmed correct results in Discord) |

## Files Reviewed

| File | Type |
|---|---|
| `src/factcheck/verify.ts` | Added |
| `src/factcheck/verify.test.ts` | Added |
| `src/factcheck/types.ts` | Modified (VerifiedFactCheckResult) |
| `src/factcheck/parse.ts` | Modified (balanced-brace extraction) |
| `src/factcheck/parse.test.ts` | Modified (+2 tests) |
| `src/factcheck/client.ts` | Modified (retrievedUrls) |
| `src/factcheck/index.ts` | Modified (verify wiring) |
| `src/factcheck/prompt.ts` | Modified (fact/opinion criteria, examples) |
| `src/factcheck/prompt.test.ts` | Modified (+3 tests) |
| `src/factcheck/format.ts` | Modified (disclaimers, VerifiedFactCheckResult) |
| `src/factcheck/format.test.ts` | Modified (+3 tests) |
| `src/commands/factcheck.ts` | Modified (M3 error message) |
| `src/index.ts` | Modified (M2 startup guard) |
| `src/eval/golden-claims.ts` | Added |
| `src/eval/run.ts` | Added |
| `package.json` | Modified (eval script) |
