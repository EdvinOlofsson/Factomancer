# Plan: Factomancer — Sourced Verdicts in Discord

**Source PRD**: `.claude/prds/factomancer.prd.md`
**Selected Milestone**: 1 — Sourced verdicts in Discord
**Complexity**: Medium

## Summary
Add a `/factcheck <claim>` slash command that sends the claim to the Anthropic API with the server-side web search tool, gets back a structured verdict (`supported` / `disproven` / `no_evidence` / `opinion`) with a worded caveat, a short explanation in the claim's language, and source links, then renders it as a colour-coded Discord embed. All AI logic lives in a testable `src/factcheck/` module so the honesty-critical parsing is unit-tested without hitting the network.

## Resolved Open Questions (from PRD)
- **Model**: `claude-sonnet-4-6` — strong enough for the "distinguish fact from opinion, never fabricate" nuance; cheap at this volume.
- **Retrieval**: Anthropic server-side **web search tool** (`web_search`) — directly delivers the "summons sources" promise with native citations.
- **Deferred to Milestone 3**: rate limiting / budget guardrails (this plan only caps per-call cost via `max_uses` + input length).

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Command shape | `src/commands/ping.ts:4` | `export const xCommand: Command = { data, async execute(interaction) {} }` |
| Command type | `src/types.ts:3` | Shared `Command` interface; `data` currently typed `SlashCommandBuilder` (must widen for options) |
| Registration | `src/index.ts:11` | `commands.set(x.data.name, x)` in the `Collection` |
| Deploy list | `src/deploy-commands.ts:10` | `const commands = [x.data.toJSON()]` |
| Env guard | `src/deploy-commands.ts:6` | `if (!VAR) throw new Error('Missing env vars: ...')` |
| Error handling | `src/events/interactionCreate.ts:11` | `command.execute(interaction).catch(console.error)` — server-side log, no user leak |
| Tests | _none exist yet_ | Vitest is configured (`package.json`), but there are no test files. This milestone introduces the first tests under `src/factcheck/*.test.ts`. |

## Files to Change
| File | Action | Why |
|---|---|---|
| `package.json` | UPDATE | Add `@anthropic-ai/sdk` and `zod` (boundary validation of model output) |
| `.env.example` | UPDATE | Add `ANTHROPIC_API_KEY` |
| `src/types.ts` | UPDATE | Widen `Command.data` to `SlashCommandBuilder \| SlashCommandOptionsOnlyBuilder` so commands with options type-check |
| `src/factcheck/types.ts` | CREATE | `Verdict` union, `Source`, `FactCheckResult`, and the Zod schema for parsing |
| `src/factcheck/prompt.ts` | CREATE | System prompt: verdict taxonomy, anti-fabrication rule, language mirroring, source tiering, JSON output contract |
| `src/factcheck/client.ts` | CREATE | Thin Anthropic wrapper: Messages call with `web_search` tool + `max_uses`; returns final text + citations |
| `src/factcheck/parse.ts` | CREATE | Validate model JSON → `FactCheckResult`; safe fallback (never fabricate) on malformed output |
| `src/factcheck/format.ts` | CREATE | `FactCheckResult` → `EmbedBuilder`, colour-coded by verdict |
| `src/factcheck/index.ts` | CREATE | Orchestrate: claim → client → parse → result |
| `src/commands/factcheck.ts` | CREATE | Slash command: `defer` → call service → `editReply` with embed; friendly error path |
| `src/index.ts` | UPDATE | Register `factcheckCommand` in the `Collection` |
| `src/deploy-commands.ts` | UPDATE | Add `factcheckCommand` to the deploy array |
| `src/factcheck/parse.test.ts` | CREATE | TDD: valid/malformed/missing-field cases, fallback, guess-only-on-no_evidence |
| `src/factcheck/prompt.test.ts` | CREATE | TDD: prompt contains taxonomy, anti-fabrication, language-mirror, claim text |
| `src/factcheck/format.test.ts` | CREATE | TDD: each verdict → correct colour/title; sources rendered; labeled guess on no_evidence |

## Data Shapes
```ts
type Verdict = 'supported' | 'disproven' | 'no_evidence' | 'opinion'

interface Source { title: string; url: string }

interface FactCheckResult {
  verdict: Verdict
  caveat: string          // worded confidence, e.g. "Multiple official sources agree"
  explanation: string     // 1-2 sentences, in the claim's language
  sources: Source[]
  educatedGuess?: string  // only when verdict === 'no_evidence', clearly labeled
  language: string        // mirrored from the claim
}
```
The model is instructed to emit exactly this as a JSON object. `parse.ts` validates with Zod; on any failure it returns a safe `no_evidence` result with an honest caveat and **no invented sources or numbers**.

## Tasks (TDD order — RED → GREEN per ECC testing rules)

### Task 1: Dependencies & env
- **Action**: `pnpm add @anthropic-ai/sdk zod`; add `ANTHROPIC_API_KEY` to `.env.example`; the real key goes in `.env` (already gitignored).
- **Mirror**: env-guard style from `deploy-commands.ts:6`.
- **Validate**: `pnpm install` clean; `ANTHROPIC_API_KEY` present in `.env`.

### Task 2: Types + Zod schema
- **Action**: Create `src/factcheck/types.ts` with the shapes above and a matching `factCheckSchema` (Zod), inferring the type from the schema where practical.
- **Mirror**: ECC TS rule — schema-based validation at boundaries; string-literal union over enum.
- **Validate**: `pnpm typecheck`.

### Task 3: Parser (write test first)
- **Action**: `parse.test.ts` covering valid JSON, fenced ```json blocks, malformed JSON, missing/extra fields, and "educatedGuess only allowed on no_evidence". Then implement `parse.ts` to pass — defensive, returns safe fallback, never throws into the command.
- **Mirror**: `unknown` → narrow safely (ECC TS error-handling rule).
- **Validate**: `pnpm test src/factcheck/parse.test.ts`.

### Task 4: Prompt builder (write test first)
- **Action**: `prompt.test.ts` asserts the system prompt contains the four verdict labels, the no-fabrication rule, the "reply in the claim's language" instruction, the source-tiering instruction (official Swedish sources first), and the JSON contract; and that the user message contains the claim. Then implement `prompt.ts`.
- **Mirror**: pure function, explicit return type.
- **Validate**: `pnpm test src/factcheck/prompt.test.ts`.

### Task 5: Formatter (write test first)
- **Action**: `format.test.ts` asserts colour + title per verdict (supported=Green, disproven=Red, no_evidence=Grey, opinion=Gold), sources rendered as links, capped at 5, and the educated guess is clearly labeled. Then implement `format.ts` returning an `EmbedBuilder`.
- **Mirror**: ECC web design sensibility — semantic colour, clear hierarchy.
- **Validate**: `pnpm test src/factcheck/format.test.ts`.

### Task 6: Anthropic client + orchestrator
- **Action**: Implement `client.ts` (Messages call: model `claude-sonnet-4-6`, `web_search` tool with `max_uses: 5`, system from `prompt.ts`) and `index.ts` (claim → client → parse → `FactCheckResult`). Read `ANTHROPIC_API_KEY` via env with a startup guard. **Verify the exact `web_search` tool type string and SDK call shape against current Anthropic docs before coding** (ECC workflow step 0).
- **Mirror**: env guard `deploy-commands.ts:6`; no secrets in source (ECC security rule).
- **Validate**: `pnpm typecheck`; a manual one-off call against the live API.

### Task 7: Slash command + wiring
- **Action**: `commands/factcheck.ts` — `SlashCommandBuilder` with a required string option `claim` (`setMaxLength(500)` to bound cost). `execute`: `await interaction.deferReply()` **immediately** (fact-check exceeds Discord's 3s ack window), call the service, `editReply({ embeds: [embed] })`; on error, `editReply` a friendly error embed and `console.error` the detail. Register in `index.ts` and `deploy-commands.ts`.
- **Mirror**: `ping.ts:4` command shape; `interactionCreate.ts:11` error handling.
- **Validate**: `pnpm deploy-commands` then `pnpm dev`; run `/factcheck` in the server.

## Validation
```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test           # parse/prompt/format suites green, 80%+ on the factcheck module
# manual smoke:
pnpm deploy-commands
pnpm dev
# in Discord: /factcheck claim:"Sverige har EU:s högsta bensinskatt"
#   → expect: a verdict embed, worded caveat, explanation in Swedish, source links
# also test honesty: a claim with no real data → expect "No solid evidence" + labeled guess, no invented numbers
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Discord 3s ack timeout (search is slow) | High if missed | `deferReply()` as the very first line of `execute` |
| `addStringOption` breaks `Command.data` typing | Medium | Widen the `data` union in `types.ts` (Task 2 / `src/types.ts`) |
| Model returns non-JSON or fabricates | Medium/High | Strict prompt + Zod-validated parser + safe `no_evidence` fallback; honesty cases tested |
| Web search cost on the $5 balance | Low/Med | `max_uses: 5` + `setMaxLength(500)` on the claim; full rate limiting is Milestone 3 |
| `web_search` tool type string / SDK shape drift | Low | Verify against current Anthropic docs before Task 6; pin SDK version |
| Output exceeds embed limits | Low | Truncate explanation; cap sources at 5 |

## Acceptance
- [ ] All tasks complete
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` pass; 80%+ coverage on `src/factcheck/`
- [ ] `/factcheck` returns a sourced, colour-coded verdict embed in the claim's language
- [ ] An unverifiable claim yields "No solid evidence" + a clearly-labeled guess with **no invented numbers**
- [ ] Patterns mirrored (Command shape, env guard, error handling), not reinvented
- [ ] No secrets in source; `ANTHROPIC_API_KEY` only via env
```
