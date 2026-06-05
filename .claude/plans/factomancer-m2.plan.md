# Plan: Factomancer — Trustworthy Honesty Behaviour

**Source PRD**: `.claude/prds/factomancer.prd.md`
**Selected Milestone**: 2 — Trustworthy honesty behaviour
**Complexity**: Medium

## Summary
Move honesty from a prompt request to a structural, tested guarantee. Add a verification layer that cross-checks every source the model claims against the URLs it *actually retrieved* via web search (returned by the API), drops fabricated sources, and flags any unsourced factual verdict as *based on the model's own knowledge* (surfaced prominently to the user). Harden the prompt's fact-vs-opinion distinction with worked examples, make the educated-guess labeling unmistakable, and add a small manual eval script so prompt changes can be checked against a golden set of claims without guessing.

## Why this milestone exists
Milestone 1 *asks* the model to be honest (system prompt) and *fails safe* on malformed output (parser fallback). Neither verifies the model's actual claims. The PRD's #1 risk — "Model fabricates a number/source despite instructions (High impact — kills trust)" — is still unmitigated in code. This milestone closes that gap with a deterministic, unit-tested layer.

## Resolved Open Questions (from PRD)
- **#4 — contested/opinion "both sides" balance**: For `opinion` verdicts, the prompt will require *one sentence of the strongest factual basis each side cites*, max ~2 sentences, with no judgment of which is correct. Bounded so it informs without editorializing.
- **#5 — educated-guess labeling**: The guess is (a) only ever produced under `no_evidence` (enforced in both parser and verifier), and (b) rendered with an unmistakable `⚠️ Unverified — not a fact-check` disclaimer prefix in the embed.

## Decision (made) — Option B: lenient flag
When the model returns a `supported`/`disproven` verdict but **none of its sources were actually retrieved**, the verifier **keeps the verdict** but marks it as unsourced. The user requirement: it must be *clearly stated that no sources were found and that the verdict is based on the model's own knowledge.*

Implementation of that requirement:
- The verifier sets a derived flag `basedOnModelKnowledge: true` on the result (verifier-set, never model-set).
- The `caveat` is overwritten to state plainly that no sources were retrieved.
- The embed renders an **unmistakable warning** field: *"⚠️ No sources found — this verdict is based on the model's own knowledge, not retrieved sources."*

This preserves correctness on stable-knowledge claims (e.g. "the moon is made of cheese" → stays `disproven`) while never letting an unsourced factual verdict masquerade as a sourced one.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Module split | `src/factcheck/*` | Pure logic (parse/format/verify) separate from impure `client.ts`; orchestrated by `index.ts` |
| TDD order | Milestone 1 | Write `*.test.ts` first, implement to green; pure modules tested without network |
| Text-block extraction | learned skill `anthropic-web-search-text-blocks` | Concatenate all text blocks; the JSON is not reliably last |
| Safe fallback | `src/factcheck/parse.ts:3` | Never throw to the command; always return a valid `FactCheckResult` |
| Immutability | ECC coding-style | Return new objects from `verify`, never mutate the parsed result |

## Files to Change
| File | Action | Why |
|---|---|---|
| `src/factcheck/client.ts` | UPDATE | Also extract the URLs actually retrieved from `web_search_tool_result` blocks; return `{ text, retrievedUrls }` instead of a bare string |
| `src/factcheck/types.ts` | UPDATE | Add the `VerifiedFactCheckResult` type (model result + verifier-set `basedOnModelKnowledge` flag) |
| `src/factcheck/verify.ts` | CREATE | Pure verification layer: drop fabricated sources, flag unsourced factual verdicts, enforce guess-only-on-no_evidence |
| `src/factcheck/verify.test.ts` | CREATE | TDD: fabrication dropped, real source kept across URL formatting differences, unsourced-factual flagged (verdict kept), opinion untouched, malformed URL dropped without throwing |
| `src/factcheck/parse.ts` | UPDATE | Fix review finding M1 (greedy regex): extract all balanced-brace candidates, return the first that validates against the schema |
| `src/factcheck/parse.test.ts` | UPDATE | Add a case: reasoning text containing an example `{...}` before the real verdict object |
| `src/factcheck/prompt.ts` | UPDATE | Add worked examples per verdict (incl. boundary cases); sharpen fact-vs-opinion criteria; bound the opinion "both sides"; clarify guess labeling |
| `src/factcheck/prompt.test.ts` | UPDATE | Assert the new criteria/examples and both-sides instruction are present |
| `src/factcheck/format.ts` | UPDATE | Take `VerifiedFactCheckResult`; render the `⚠️ Unverified — not a fact-check` disclaimer on the educated-guess field, AND a `⚠️ No sources found — based on the model's own knowledge` warning field when `basedOnModelKnowledge` is set |
| `src/factcheck/format.test.ts` | UPDATE | Assert the guess disclaimer; assert the no-sources warning renders when flagged and is absent otherwise |
| `src/factcheck/index.ts` | UPDATE | Orchestrate client → parse → **verify** |
| `src/eval/golden-claims.ts` | CREATE | ~10 curated claims with expected verdict categories, incl. tricky boundary cases |
| `src/eval/run.ts` | CREATE | Manual eval: run `factCheck` over the golden set, print a pass/fail table. Gated by `ANTHROPIC_API_KEY`, NOT part of `pnpm test` |
| `package.json` | UPDATE | Add `"eval": "tsx src/eval/run.ts"` |

## Data shapes
```ts
// client.ts — new return type
interface FactCheckRaw {
  text: string
  retrievedUrls: string[]   // every url from web_search_result blocks the API returned
}

// types.ts — verifier output is a richer type than raw model output.
// The flag is verifier-set only, so it stays OUT of the model-facing Zod schema.
type VerifiedFactCheckResult = FactCheckResult & { basedOnModelKnowledge?: boolean }

// verify.ts
function verifyFactCheck(
  result: FactCheckResult,
  retrievedUrls: readonly string[],
): VerifiedFactCheckResult
```

### Verifier rules (the heart of this milestone)
1. Normalize retrieved URLs to a `Set` of hostnames (lowercased, `www.` stripped).
2. Keep only sources whose hostname is in that set. A source URL that won't parse → treated as fabricated → dropped.
3. If `verdict ∈ {supported, disproven}` **and** no sources survive → **flag, don't downgrade** (Option B):
   - keep `verdict` and `explanation` unchanged
   - `basedOnModelKnowledge → true`
   - `caveat →` "No sources retrieved — based on the model's own knowledge"
   - `sources → []`
4. Otherwise return the result with the filtered source list (and `basedOnModelKnowledge` unset).
5. Invariant (belt-and-suspenders with parser): `educatedGuess` present **iff** `verdict === 'no_evidence'`.
6. All returns are new objects (no mutation).

*Matching at hostname granularity* tolerates the URL-formatting variance LLMs produce (trailing slash, query params, casing — see learned skill `zod-v4-url-llm-output`) while still catching the egregious case: a domain that never appeared in real search results.

## Tasks (TDD order)

### Task 1: Parser robustness (review finding M1)
- **Action**: Replace the greedy `/\{[\s\S]*\}/` with a balanced-brace scan that yields every top-level `{...}` candidate; return the first that passes `factCheckResultSchema`. Add the two-objects test first.
- **Validate**: `pnpm test src/factcheck/parse.test.ts`.

### Task 2: Verifier (write tests first)
- **Action**: Add `VerifiedFactCheckResult` to `types.ts`. Write `verify.test.ts` for all six rules above (note rule 3 = flag-not-downgrade), then implement `verify.ts` as a pure function.
- **Mirror**: immutability; safe handling of unparseable URLs (try/catch, no throw).
- **Validate**: `pnpm test src/factcheck/verify.test.ts`.

### Task 3: Client returns retrieved URLs
- **Action**: Extend `runFactCheck` to walk `response.content`, collect `web_search_result.url` from each `web_search_tool_result` block (guard against the `web_search_tool_result_error` shape), and return `{ text, retrievedUrls }`. **Verify the exact SDK block/field type names against the current Anthropic types before coding** (same diligence as Milestone 1).
- **Validate**: `pnpm typecheck`.

### Task 4: Orchestrator wiring
- **Action**: `index.ts` → `const { text, retrievedUrls } = await runFactCheck(claim); return verifyFactCheck(parseFactCheckResult(text), retrievedUrls)`.
- **Validate**: `pnpm typecheck`.

### Task 5: Prompt hardening (write test first)
- **Action**: Add to `prompt.test.ts` assertions for: a worked example per verdict, the fact-vs-opinion criteria, and the bounded both-sides instruction. Then update `prompt.ts`. Keep it focused — examples short, no prompt bloat.
- **Validate**: `pnpm test src/factcheck/prompt.test.ts`.

### Task 6: Format the disclaimers (write test first)
- **Action**: Switch `formatFactCheckEmbed` to accept `VerifiedFactCheckResult`. `format.test.ts` asserts (a) the `⚠️ Unverified — not a fact-check` prefix on the guess field, and (b) a `⚠️ No sources found — based on the model's own knowledge` warning field appears when `basedOnModelKnowledge` is set and is absent otherwise. Implement in `format.ts`.
- **Validate**: `pnpm test src/factcheck/format.test.ts`.

### Task 7: Golden-set eval (manual, optional to run)
- **Action**: `src/eval/golden-claims.ts` (~10 claims: 2–3 each of supported/disproven/no_evidence/opinion, including a factual-sounding opinion and an unverifiable factual claim). `src/eval/run.ts` calls `factCheck` per claim, compares verdict *category*, prints a pass/fail table, exits non-zero only on a hard error (never on a single category miss — these are judgment calls). Add `pnpm eval`.
- **Cost note**: each run hits the live API (~10 calls × web search). Run deliberately, not in CI.
- **Validate**: `pnpm eval` (manual, with `ANTHROPIC_API_KEY` set) — review the table by hand.

## Validation
```bash
pnpm typecheck
pnpm lint
pnpm test            # parse/verify/prompt/format suites green; 80%+ on src/factcheck
# manual, costs API credit — run when prompt or verifier changes:
pnpm eval
# Discord smoke tests:
#   /factcheck claim:"<a claim with a real, checkable answer>"   → sourced verdict
#   /factcheck claim:"<an obscure unverifiable claim>"           → No solid evidence + labeled guess, no invented numbers
#   /factcheck claim:"Policy X will ruin the Swedish economy"    → Opinion, both-sides, no side taken
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Hostname match drops a legitimate source (model paraphrased a redirect/shortened URL) | Low | Match at hostname granularity, not full URL; the model is told to cite the URLs it retrieved |
| Unsourced factual verdict (Option B) is taken at face value despite no sources | Medium | Prominent `⚠️ No sources found — based on the model's own knowledge` warning + overwritten caveat; verdict is never presented as sourced |
| `web_search_tool_result` SDK type names differ from assumption | Low | Verify against current Anthropic types before Task 3 (Milestone-1 discipline) |
| Eval non-determinism (same claim, different category run-to-run) | Medium | Eval prints for human judgment; never a hard CI gate; assert category not exact text |
| Prompt example bloat raises token cost | Low | Keep examples to one short line each; measure prompt length |

## Pre-work (optional, quick — from the Milestone 1 review)
- **M2** `client.ts`: instantiate the Anthropic client at module load after the env guard, so a missing `ANTHROPIC_API_KEY` fails at startup, not mid-request. (This milestone touches `client.ts` anyway — fold it in.)
- **M3** `factcheck.ts`: include the error message in the `console.error` so Anthropic error codes aren't lost.

## Acceptance
- [ ] All tasks complete
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` pass; 80%+ coverage on `src/factcheck/`
- [ ] A fabricated source URL is structurally dropped (proven by `verify.test.ts`)
- [ ] An unsourced `supported`/`disproven` verdict keeps its verdict but is flagged and rendered with the `⚠️ No sources found — based on the model's own knowledge` warning
- [ ] `opinion` verdicts present both sides without taking one
- [ ] The educated guess is rendered with an unmistakable unverified disclaimer
- [ ] `pnpm eval` runs and its golden-set table is reviewed by hand
- [ ] Review findings M1 (and folded-in M2/M3) resolved
