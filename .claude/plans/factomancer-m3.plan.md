# Plan: Factomancer — Budget-Safe Operation

**Source PRD**: `.claude/prds/factomancer.prd.md`
**Selected Milestone**: 3 — Budget-safe operation
**Complexity**: Small

## Summary
Add an in-memory rate limiter that enforces per-user and global-daily call limits, surfacing a friendly ephemeral message when a limit is hit. Log actual search count per call so the owner can spot usage spikes in the `pnpm dev` console without leaving the terminal. No new dependencies, no database, zero infrastructure — a single pure module and one integration point in the command.

## Resolved Open Questions (from PRD)
- **#1 — Model choice**: Resolved in M1 (`claude-sonnet-4-6`). No change.
- **#2 — Web search tool vs alternative**: Resolved in M1 (Anthropic `web_search_20250305`). No change.
- **#3 — How aggressively to rate-limit**: See limits below, configurable via env vars.
- **#4 and #5**: Resolved in M2.

## Proposed Default Limits
| Limit | Default | Rationale |
|-------|---------|-----------|
| Per-user, per hour | 5 calls | Generous for a real discussion; prevents one person draining the budget in a burst |
| Global, per day | 20 calls | ~$1.40 max/day → $5 lasts ≥ 3.5 days of very heavy use; realistic sessions use far fewer |

Both are configurable via `.env` so you can tighten or loosen without a code change:
```
RATE_LIMIT_PER_USER_HOUR=5
RATE_LIMIT_GLOBAL_DAILY=20
```

## Architecture — why in-memory is right here
A Redis/DB store would be over-engineering for a single-process bot with 4 users. In-memory `Map`s:
- Zero dependencies and zero infra
- Survive as long as the process runs (which is fine — limits reset if the bot restarts, and that's acceptable)
- Are trivially unit-testable without mocking

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Module structure | `src/factcheck/verify.ts:1` | Pure exported function(s), no side effects, testable in isolation |
| Env config | `src/index.ts:1` | Read from `process.env`, validate at startup; fallback to constant default |
| Error to user | `src/commands/factcheck.ts:27` | `console.error` server-side; friendly message to user |
| Ephemeral reply | — | None yet — this introduces the first `{ ephemeral: true }` reply; check before `deferReply()` |
| Test style | `src/factcheck/verify.test.ts` | `describe`/`it`/`expect`, Vitest, co-located `.test.ts` |

## Files to Change
| File | Action | Why |
|------|--------|-----|
| `src/factcheck/limiter.ts` | CREATE | Pure rate-limiter module |
| `src/factcheck/limiter.test.ts` | CREATE | TDD: per-user limit, global limit, env-configured limits, reset behaviour |
| `src/commands/factcheck.ts` | UPDATE | Check limiter before `deferReply()`; log search count from response usage |
| `src/factcheck/client.ts` | UPDATE | Return `searchesUsed` alongside text + retrievedUrls |
| `src/factcheck/index.ts` | UPDATE | Thread `searchesUsed` back to the command for logging |
| `src/commands/usage.ts` | CREATE | `/usage` slash command — shows per-user + global quota, ephemeral |
| `src/index.ts` | UPDATE | Register `usageCommand` |
| `src/deploy-commands.ts` | UPDATE | Add `usageCommand` to deploy array |
| `.env.example` | UPDATE | Add `RATE_LIMIT_PER_USER_HOUR` and `RATE_LIMIT_GLOBAL_DAILY` |
| `CLAUDE.md` | UPDATE | Document rate limits and `pnpm dev` usage logging |

## Data Shapes
```ts
// limiter.ts
interface RateLimitResult {
  allowed: boolean
  reason?: string        // user-facing message when denied
  retryAfterMs?: number  // for per-user window — "try again in X minutes"
}

export function checkRateLimit(userId: string): RateLimitResult
export function recordUsage(userId: string): void

// client.ts — extended return type
interface FactCheckRaw {
  text: string
  retrievedUrls: string[]
  searchesUsed: number   // from response.usage.server_tool_use?.web_search_requests ?? 0
}
```

## Rate Limiter Internals
```
Per-user (sliding window):
  userWindows: Map<userId, timestamp[]>
  On check: drop timestamps older than 1 hour, count remaining
  On record: push Date.now()

Global daily (date-keyed counter):
  dailyKey: string = toISODate(new Date())  // "2026-06-05"
  dailyCount: number
  On check: if key changed, reset counter; check count < limit
  On record: increment counter
```

## Tasks (TDD order)

### Task 1: Limiter (write test first)
- **Action**: Write `limiter.test.ts` covering: under-limit allowed, per-user limit enforced, global daily limit enforced, `retryAfterMs` present on per-user denial, global denial has no retryAfter, env-var overrides respected, recording usage advances both counters.
- Then implement `limiter.ts` as a module-level singleton (Map + counter, no class needed).
- **Mirror**: pure module pattern from `verify.ts`; read env vars at module init with numeric fallback.
- **Validate**: `pnpm test src/factcheck/limiter.test.ts`

### Task 2: Thread searchesUsed through the pipeline
- **Action**: Extend `FactCheckRaw` with `searchesUsed`; read from `response.usage?.server_tool_use?.web_search_requests ?? 0` in `client.ts`; pass through `index.ts` alongside the `VerifiedFactCheckResult`.
  Update `factCheck()` return to `{ result: VerifiedFactCheckResult; searchesUsed: number }`.
- **Mirror**: same shape change as M2's `retrievedUrls` addition.
- **Validate**: `pnpm typecheck`

### Task 3: Command integration
- **Action**: In `factcheck.ts`:
  1. Read `userId = interaction.user.id`
  2. `const limit = checkRateLimit(userId)` — synchronous, before `deferReply()`
  3. If `!limit.allowed`: `await interaction.reply({ content: limitMessage(limit), ephemeral: true }); return`
  4. `recordUsage(userId)` immediately after allowed check
  5. Proceed with `deferReply()` as before
  6. After `editReply`, log: `console.log('[factcheck] searches used:', searchesUsed)`
- **Mirror**: `factcheck.ts:18` — `deferReply()` must remain the first async call on the allowed path.
- **Validate**: `pnpm typecheck && pnpm lint`

### Task 4: Config + docs
- **Action**: Add `RATE_LIMIT_PER_USER_HOUR` and `RATE_LIMIT_GLOBAL_DAILY` to `.env.example` with comments explaining the cost math. Update `CLAUDE.md` with a **Rate limiting** section.
- **Validate**: visual check of `.env.example` and `CLAUDE.md`

## Validation
```bash
pnpm typecheck
pnpm lint
pnpm test           # limiter suite + all existing suites still green
# manual smoke:
pnpm dev
# 1. Run /factcheck 6 times as the same user within 1 minute
#    → first 5 succeed, 6th returns ephemeral "limit reached" message
# 2. Verify the searches-used log line appears in the pnpm dev console
```

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `response.usage` shape differs from SDK types | Low | Use optional chaining + `?? 0` fallback; `pnpm typecheck` catches it |
| In-memory limits reset on bot restart | Low/acceptable | Document in `CLAUDE.md`; acceptable for a 4-person private bot |
| Default limits feel too tight or too loose | Medium | Configurable via env vars without code change; adjust after first week of use |
| `ephemeral: true` conflicts with `deferReply()` | n/a | Avoided by checking limit before `deferReply()` — the reply is non-deferred |

## Acceptance
- [ ] All tasks complete
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` pass; limiter suite covers all branches
- [ ] Rate-limited reply is ephemeral (only the blocked user sees it)
- [ ] Searches-used count logs to console on every successful call
- [ ] Limits configurable via `.env` without code change
- [ ] `CLAUDE.md` documents rate limits and how to adjust them
