# Factomancer

> Summons sources, dispels misinformation, and turns wild claims into verified facts.

## Problem
When a small group of friends discusses the 2026 Swedish general election (riksdagsval, September 2026) in their private Discord server, confident claims get made that nobody can quickly verify, and arguments stall. They want a fast, in-channel way to check a claim against real sources — and, just as importantly, to be told honestly when no solid evidence exists rather than being handed a confident-sounding guess.

## Evidence
- This is a **personal learning + fun side project**, not a validated market problem. Recorded honestly as such.
- The owner could use Google or established Swedish fact-checkers (Källkritikbyrån, Faktiskt.se) today; the point is the build experience (ECC + Anthropic API) and a tool tailored to the group's own discussions.
- Observed pattern (owner-reported): big claims surface during election chat, verification is slow, discussion goes in circles.

## Users
- **Primary**: The owner + ~3 friends in one private Discord server. Technical comfort varies; the owner is an experienced developer.
- **Not for**: Public/multi-server use, broad distribution, or any audience beyond the private group. Explicitly will not spread.

## Hypothesis
We believe a Discord bot that **retrieves real sources and returns a clear verdict with a grounded, worded confidence caveat** will let our group **settle factual election claims quickly and stay honest about contested or unverifiable ones**.
We'll know we're right when **we reach for it mid-discussion instead of Googling, and it reliably says "no solid evidence" instead of inventing numbers.**

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Actually used in real discussions | We reach for it unprompted | Qualitative — owner observation over election season |
| Fabricated numbers / sources | Zero | Spot-check of responses against cited sources |
| Honest "no evidence" behaviour | Feels trustworthy, not lazy | Group judgement on unverifiable test claims |
| Stays within budget | Within the $5 API balance under normal use | Anthropic console usage tracking |

## Scope
**MVP** — A `/factcheck <claim>` slash command that:
- Retrieves sources at query time (Claude API + web search), preferring official Swedish sources first.
- Returns a **verdict** from a fixed taxonomy: `Supported` / `Disproven` / `No solid evidence` / `Opinion — not factually checkable`.
- Adds a **hybrid confidence signal**: the verdict plus a short worded caveat (e.g. "thin evidence", "multiple sources agree) — never a fake-precise percentage.
- Includes a 1–2 sentence explanation and **source links**.
- Replies in the **same language as the claim**.
- Hard rule: **never fabricate numbers or sources**. If unsupported, say so plainly, with an optional, clearly-labeled brief "educated guess" that can never be mistaken for a verified verdict.

**Out of scope**
- Auto-scanning every message — privacy and cost cost; deferred.
- A database / memory of past checks — not needed to test the hypothesis.
- Multi-server or public distribution — explicitly never.
- User accounts, dashboards, analytics — no value for a 4-person server.
- Image / screenshot / video claims — text only for MVP.
- Reply-to-message + mention trigger — deferred; slash command first (avoids the Message Content privileged intent).

## Delivery Milestones
<!-- Business outcomes, not engineering tasks. /plan turns each into a plan. -->
<!-- Status: pending | in-progress | complete -->

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Sourced verdicts in Discord | `/factcheck <claim>` returns a verdict + worded caveat + source links, mirroring the claim's language | in-progress | `.claude/plans/factomancer.plan.md` |
| 2 | Trustworthy honesty behaviour | Reliably distinguishes factual / contested / unverifiable claims and never fabricates numbers; "no solid evidence" path and labeled educated-guess behave correctly | pending | — |
| 3 | Budget-safe operation | Group can use it without runaway cost; rate/cost guardrails keep it within the $5 balance | pending | — |

## Open Questions
- [ ] Which Claude model balances reasoning quality vs cost on a $5 budget? (decide in `/plan`)
- [ ] Use Anthropic's built-in web search tool vs another retrieval path, given per-search cost?
- [ ] How aggressively to rate-limit so four people can't accidentally drain the balance?
- [ ] For contested claims, how much "both sides" evidence to show before it tips into editorializing?
- [ ] How exactly to label the optional "educated guess" so it is never mistaken for a verified verdict?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Model fabricates a number/source despite instructions | Medium | High — kills trust | Strict prompt + fixed verdict taxonomy with explicit "no solid evidence" path; require links for factual claims; spot-check |
| Biased framing on contested election topics | Medium | Medium | Separate factual from interpretive; cite, don't editorialize; for opinion claims return "not factually checkable" + strongest evidence each way |
| Cost overrun beyond $5 balance | Low–Medium | Low — bot just stops | Rate limiting; bounded searches; cheaper model; watch console usage |
| Stale info (promises, polls shift) | Medium | Medium | Prefer recent, dated sources; surface source dates; search at query time, not model memory |
| Queries sent to Anthropic API | Low | Low | Tell the group; private server; no unnecessary logging of message content |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
