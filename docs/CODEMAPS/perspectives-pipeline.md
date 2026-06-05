<!-- Generated: 2026-06-06 | Files scanned: 34 | Token estimate: ~350 -->

# Perspectives Pipeline

## Data Flow

```
topic: string
  → runPerspectives(topic): string        ← Anthropic (claude-sonnet-4-6, no tools), text
  → parsePerspectives(text): PerspectivesResult | null   ← lib/json-extract + Zod
  → formatPerspectivesEmbed(result, topic): EmbedBuilder
```
`null` = generation failed → command shows "Could not generate perspectives — try rephrasing".

## Types (src/perspectives/types.ts)

```ts
LensKey = 'left' | 'right' | 'libertarian' | 'authoritarian'
PerspectivesResult = { left: string; right: string; libertarian: string; authoritarian: string }
```

## Module Responsibilities

### client.ts — Anthropic boundary
- Model `claude-sonnet-4-6`, `max_tokens: 1500`, NO tools (no web search)
- Uses shared `getAnthropicClient()`
- Returns all text blocks concatenated

### prompt.ts — system prompt
- Four lenses as coherent archetypes (left / right / libertarian / authoritarian)
- Charitable (strongest version, no strawman); equal length per lens
- Match the topic's intensity; floor: arguments not operational harm / no slurs
- Language mirror; present, never adjudicate
- Output ONLY `{ left, right, libertarian, authoritarian }` JSON

### parse.ts — `parseModelJson(text, perspectivesSchema)` → result or null (no fallback object)

### format.ts — single embed
- Colour `0x9b59b6`; title = topic; four fields (⬅️ ➡️ 🗽 🏛️); values capped 1024
- Footer disclaimer: "not facts or official party positions"

## Contrast with /factcheck
No web search, no source verification, no `searchesUsed`. Pure synthesis — simpler pipeline.
To switch this command to Opus: change `MODEL` in `perspectives/client.ts` only.
