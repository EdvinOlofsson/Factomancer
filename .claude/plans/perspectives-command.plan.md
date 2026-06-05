# Plan: /perspectives — Ideological Lens Command

**Source PRD**: `.claude/prds/perspectives-command.prd.md`
**Selected Milestone**: 1 — Four-lens perspectives in Discord
**Complexity**: Medium

## Summary
Add a `/perspectives <topic>` command that returns one embed with four charitable, equal-weighted ideological framings (Left, Right, Libertarian, Authoritarian) of any topic, in the topic's language, matching the topic's intensity. Because this is the second AI command, first extract the shared Anthropic plumbing (client singleton + JSON extraction) into `src/lib/` so both commands build on one foundation. No web search — this is perspective synthesis, not fact-checking.

## Decisions resolved
- **One embed**, four fields (Left / Right / Libertarian / Authoritarian).
- **Rate limiting**: reuse the existing `limiter.ts` (shared quota with `/factcheck`). Cost isn't a concern; reuse keeps the architecture invariant ("rate-limit before defer") consistent. Limiter user-facing wording is generalised from "fact-checks" → "requests" so it fits any command.
- **Intensity matching**: the prompt represents each worldview at the register the topic invites — radical topics get radical-but-authentic framings, not sanitised ones. One floor: characterise a worldview's *arguments and reasoning*, do not emit operational instructions for harm or dehumanising slurs targeting real groups. This keeps the tool honest and provocative without producing genuinely harmful output.
- **Model**: `claude-sonnet-4-6` (consistent with `/factcheck`, strong at nuanced characterisation). It's a one-constant change to Opus if you later want richer takes — flagged as an easy toggle, not a blocker.
- **No web search, no sourcing** — confirmed by PRD scope.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Module layout | `src/factcheck/*` | `types.ts` + `prompt.ts` + `client.ts` + `parse.ts` + `format.ts` + `index.ts` |
| Command shape | `src/commands/factcheck.ts:17` | rate-limit → defer → call → editReply; friendly error path |
| Rate-limit gate | `src/commands/factcheck.ts:18` | `checkRateLimit` before `deferReply()`; `recordUsage` after allowed |
| Safe parse | `src/factcheck/parse.ts:3` | Validate model JSON; never throw to the command |
| Embed format | `src/factcheck/format.ts:4` | `EmbedBuilder`, fields, footer; cap field values |
| Tests | `src/factcheck/*.test.ts` | Vitest `describe`/`it`; co-located `.test.ts`; pure modules tested without network |
| Registration | `src/index.ts:16`, `src/deploy-commands.ts:11` | register in both files, then `pnpm deploy-commands` |

## Files to Change
| File | Action | Why |
|---|---|---|
| `src/lib/anthropic.ts` | CREATE | Shared `getAnthropicClient()` singleton |
| `src/lib/json-extract.ts` | CREATE | Shared `extractJsonCandidates()` + generic `parseModelJson(text, schema)` |
| `src/lib/json-extract.test.ts` | CREATE | TDD: balanced-brace extraction, schema validation, multiple-object handling |
| `src/factcheck/client.ts` | UPDATE | Use `getAnthropicClient()` (drop local singleton) — behaviour-preserving |
| `src/factcheck/parse.ts` | UPDATE | Use shared `parseModelJson`; keep `stripUnverifiedGuess` + fallback |
| `src/factcheck/limiter.ts` | UPDATE | Generalise denial wording ("fact-checks" → "requests") |
| `src/perspectives/types.ts` | CREATE | `LensKey`, `PerspectivesResult`, Zod schema |
| `src/perspectives/prompt.ts` | CREATE | System prompt: four lenses, charitable, intensity-match, floor, language mirror, JSON contract |
| `src/perspectives/prompt.test.ts` | CREATE | Assert lens names, charitable + intensity instructions, no-adjudication, JSON fields |
| `src/perspectives/client.ts` | CREATE | Anthropic call (no web_search tool); returns concatenated text |
| `src/perspectives/parse.ts` | CREATE | `parseModelJson` → `PerspectivesResult \| null` |
| `src/perspectives/parse.test.ts` | CREATE | Valid all-four, missing lens → null, malformed → null, surrounding prose |
| `src/perspectives/format.ts` | CREATE | `PerspectivesResult` → `EmbedBuilder` (4 fields + disclaimer footer) |
| `src/perspectives/format.test.ts` | CREATE | Four labelled fields, topic in title, disclaimer footer, value cap |
| `src/perspectives/index.ts` | CREATE | Orchestrate topic → client → parse |
| `src/commands/perspectives.ts` | CREATE | Slash command |
| `src/index.ts` | UPDATE | Register `perspectivesCommand` |
| `src/deploy-commands.ts` | UPDATE | Add `perspectivesCommand` to deploy array |
| `CLAUDE.md` | UPDATE | Add `/perspectives` to the slash-commands table |

## Data Shapes
```ts
// perspectives/types.ts
type LensKey = 'left' | 'right' | 'libertarian' | 'authoritarian'

const perspectivesSchema = z.object({
  left: z.string().min(1),
  right: z.string().min(1),
  libertarian: z.string().min(1),
  authoritarian: z.string().min(1),
})
type PerspectivesResult = z.infer<typeof perspectivesSchema>

// lib/json-extract.ts
function extractJsonCandidates(text: string): string[]
function parseModelJson<T>(text: string, schema: ZodType<T>): T | null

// perspectives/index.ts — null = generation failed, command shows a friendly error
async function generatePerspectives(topic: string): Promise<PerspectivesResult | null>
```

## Prompt Design (the heart of this command)
Each lens defined as a coherent archetype so the model anchors consistently:
- **Left** — collective welfare, equality, state action for social goods, scepticism of concentrated private power
- **Right** — tradition, order, market and individual responsibility, national cohesion, scepticism of rapid change
- **Libertarian** — individual liberty, minimal state, voluntary exchange, scepticism of coercion from any direction
- **Authoritarian** — order and central authority, collective discipline, security prioritised over individual dissent

Rules in the prompt:
1. All four lenses, 2–3 sentences each, equal length and structure — no lens privileged or marked "correct"
2. **Charitable**: the strongest, most coherent version of each view, never a strawman
3. **Match the topic's intensity**: do not sanitise; represent radical framings authentically when the topic invites them
4. **Floor**: characterise each worldview's arguments and reasoning; do not produce operational instructions for harm or dehumanising slurs targeting real groups
5. **Language mirror**: reply in the topic's language
6. **Present, never adjudicate**: do not state which perspective is right
7. Output ONLY the JSON object `{ left, right, libertarian, authoritarian }`

## Tasks (TDD order)

### Task 1: Extract shared AI lib (foundation)
- **Action**: Create `lib/anthropic.ts` (`getAnthropicClient()`) and `lib/json-extract.ts` (`extractJsonCandidates` moved from `factcheck/parse.ts`, plus generic `parseModelJson`). Write `json-extract.test.ts` first. Refactor `factcheck/client.ts` to use `getAnthropicClient()` and `factcheck/parse.ts` to use `parseModelJson` (keeping `stripUnverifiedGuess` + `SAFE_FALLBACK`).
- **Mirror**: existing `getClient` and `extractJsonCandidates` — move, don't rewrite.
- **Validate**: `pnpm test` — **all existing factcheck suites must stay green** (proves the refactor is behaviour-preserving).

### Task 2: Generalise limiter wording
- **Action**: Reword denial messages in `limiter.ts` to be command-agnostic ("requests" not "fact-checks"); keep "hourly"/"daily" tokens so existing tests still assert correctly.
- **Validate**: `pnpm test src/factcheck/limiter.test.ts`.

### Task 3: Perspectives types
- **Action**: `perspectives/types.ts` with `LensKey`, schema, `PerspectivesResult`.
- **Validate**: `pnpm typecheck`.

### Task 4: Prompt (write test first)
- **Action**: `prompt.test.ts` asserts the four lens keys, the charitable + intensity-match + floor instructions, no-adjudication, language-mirror, and JSON contract; then implement `prompt.ts`.
- **Validate**: `pnpm test src/perspectives/prompt.test.ts`.

### Task 5: Parser (write test first)
- **Action**: `parse.test.ts` (valid all-four → result; missing a lens → null; malformed → null; JSON amid prose → extracted). Implement `parse.ts` on top of shared `parseModelJson`.
- **Validate**: `pnpm test src/perspectives/parse.test.ts`.

### Task 6: Client + orchestrator
- **Action**: `client.ts` (Anthropic call, model `claude-sonnet-4-6`, `max_tokens: 1500`, no tools) returning concatenated text; `index.ts` → `parsePerspectives(text)` returning `PerspectivesResult | null`.
- **Validate**: `pnpm typecheck`.

### Task 7: Formatter (write test first)
- **Action**: `format.test.ts` asserts four labelled fields (⬅️ Left / ➡️ Right / 🗽 Libertarian / 🏛️ Authoritarian), topic in the title, disclaimer footer, field-value cap at 1024. Implement `format.ts` (single embed, neutral colour `0x9b59b6`).
- **Validate**: `pnpm test src/perspectives/format.test.ts`.

### Task 8: Command + registration
- **Action**: `commands/perspectives.ts` — string option `topic` (required, `setMaxLength(300)`); `checkRateLimit` → on deny ephemeral reply + return; `recordUsage`; `deferReply`; `generatePerspectives` → null path shows friendly "couldn't generate perspectives — try rephrasing"; else embed. Register in `index.ts` + `deploy-commands.ts`.
- **Mirror**: `factcheck.ts` command flow exactly.
- **Validate**: `pnpm typecheck && pnpm lint`.

### Task 9: Docs
- **Action**: Add `/perspectives` to the slash-commands table in `CLAUDE.md`. (Run `/update-codemaps` after merge — note in the report, not part of this task.)
- **Validate**: visual check.

## Validation
```bash
pnpm typecheck
pnpm lint
pnpm test            # shared lib + perspectives suites + all existing suites green
# manual smoke:
pnpm deploy-commands
pnpm dev
# /perspectives topic:"nuclear energy"          → four measured lenses
# /perspectives topic:"kärnkraft"               → four lenses in Swedish (language mirror)
# /perspectives topic:"<a deliberately spicy topic>"  → lenses match the intensity, floor holds
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Shared-lib refactor regresses `/factcheck` | Low | Behaviour-preserving move; factcheck parse suite must stay green as proof |
| One lens reads as a strawman or biased | Medium | Prompt enforces equal length + charitable framing; spot-check across topics |
| Intensity-matching produces harmful output | Low/Med | Explicit floor in prompt (arguments not operational harm); private 4-person server |
| Model returns non-JSON / a missing lens | Low | `parseModelJson` → null → friendly error, never a half-rendered embed |
| Shared daily limit means heavy `/perspectives` blocks `/factcheck` | Low | Acceptable (cost not a concern); raise `RATE_LIMIT_GLOBAL_DAILY` or split counters later |

## Acceptance
- [ ] All tasks complete
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` pass; existing factcheck suites unchanged and green
- [ ] `/perspectives <topic>` returns one embed with four charitable, equal-weighted lenses
- [ ] Output mirrors the topic's language and matches its intensity; floor holds on spicy topics
- [ ] Disclaimer footer present on every response
- [ ] Shared `src/lib/` used by both `/factcheck` and `/perspectives` (foundation established)
- [ ] No lens is adjudicated as correct
