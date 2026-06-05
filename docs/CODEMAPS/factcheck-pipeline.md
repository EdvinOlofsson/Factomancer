<!-- Generated: 2026-06-06 | Files scanned: 34 | Token estimate: ~700 -->
<!-- NOTE: client.ts uses src/lib/anthropic.ts; parse.ts uses src/lib/json-extract.ts (shared with /perspectives) -->

# Factcheck Pipeline

## Data Flow

```
claim: string
  → runFactCheck(claim): FactCheckRaw
      { text: string, retrievedUrls: string[], searchesUsed: number }
  → parseFactCheckResult(text): FactCheckResult
      { verdict, caveat, explanation, sources[], educatedGuess? }
  → verifyFactCheck(result, retrievedUrls): VerifiedFactCheckResult
      same shape + basedOnModelKnowledge?: boolean
  → formatFactCheckEmbed(result, claim): EmbedBuilder
```

## Types (src/factcheck/types.ts)

```ts
Verdict = 'supported' | 'disproven' | 'no_evidence' | 'opinion'

Source           = { title: string; url: string }
FactCheckResult  = { verdict, caveat, explanation, sources[], educatedGuess? }
VerifiedFactCheckResult = FactCheckResult & { basedOnModelKnowledge?: boolean }
FactCheckOutcome = { result: VerifiedFactCheckResult; searchesUsed: number }
```

## Module Responsibilities

### client.ts — Anthropic API boundary
- Model: `claude-sonnet-4-6`
- Tool: `web_search_20250305`, max_uses 5, SE locale
- max_tokens: 2048
- Returns: all text blocks concatenated + URLs from web_search_tool_result blocks + search count

### parse.ts — JSON extraction
- Balanced-brace scanner (handles braces inside JSON string values)
- Tries each `{...}` candidate in document order; returns first that passes Zod schema
- SAFE_FALLBACK: `{ verdict: 'no_evidence', sources: [] }` on any failure — never throws

### verify.ts — source cross-check
- Normalises hostnames (strips `www.`, lowercases)
- `hostsMatch(a, b)` — suffix match: `data.riksdagen.se` matches `riksdagen.se`
  - Leading-dot guard: `evil-riksdagen.se` does NOT match `riksdagen.se`
- Option B: if factual verdict (`supported`/`disproven`) has zero verified sources →
  keeps verdict, sets `basedOnModelKnowledge: true`, overwrites caveat
- `educatedGuess` only survives when `verdict === 'no_evidence'`

### prompt.ts — system prompt
- Fact-vs-opinion criteria with worked examples
- Anti-fabrication rules (NEVER invent numbers/URLs)
- Source tiering: riksdagen.se, scb.se, valmyndigheten.se → major Swedish news → international
- Language mirror: reply in the same language as the claim
- Opinion handling: one sentence each side's strongest basis, no editorialising

### format.ts — Discord embed
- Colours: supported=green(0x2ecc71), disproven=red(0xe74c3c),
           no_evidence=grey(0x95a5a6), opinion=gold(0xf39c12)
- Claim capped at 256 chars in description
- Sources capped at 5, rendered as markdown links
- `basedOnModelKnowledge` → `⚠️ No sources found` field
- `educatedGuess` → `📝 Educated guess (unverified)` field with `⚠️ Unverified` prefix

## Adding a New Verdict Type
1. Add to `verdictSchema` in `types.ts`
2. Add entry to `VERDICT_CONFIG` in `format.ts`
3. Update system prompt taxonomy in `prompt.ts`
4. Add prompt test assertions in `prompt.test.ts`
