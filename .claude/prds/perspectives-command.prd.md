# /perspectives — Ideological Lens Command

## Problem
During discussions, the friend group argues from different underlying value systems without making those premises explicit. Each person is reasoning correctly *within* their own frame, but nobody surfaces what the other frames look like. The result is circular arguments that don't move forward. There's no fast, low-friction way to put multiple worldviews side-by-side on any topic mid-conversation.

## Evidence
- Assumption — personal observation by the owner of recurring circular arguments in the Discord server.
- Same learning/fun motivation as Factomancer: building it is the point, not proving market demand.

## Users
- **Primary**: The owner + ~3 friends in the same private Discord server as Factomancer. The trigger is any moment someone wants to understand how a different value system would frame the topic being discussed.
- **Not for**: Public distribution, official party position lookup, or factual verification (that's `/factcheck`).

## Hypothesis
We believe a `/perspectives <topic>` command that presents the left, right, libertarian, and authoritarian frames on any topic will help our group **understand the value-system roots of a disagreement** and have a more informed, thought-provoking debate. We'll know it works when someone reaches for it mid-argument to illuminate *why* people disagree, not just *that* they disagree.

## Success Metrics
| Metric | Target | How measured |
|---|---|---|
| Actually used mid-discussion | Reached for unprompted | Owner observation |
| Perspectives feel charitable, not strawmen | Each lens feels like a genuine version of that worldview | Group judgement after a few uses |
| Topic coverage | Works on any topic (not just Swedish politics) | Spot-checks across diverse topics |

## Scope

**MVP** — A `/perspectives <topic>` command that:
- Accepts any free-text topic (max ~300 characters)
- Always presents **all four lenses**: Left, Right, Libertarian, Authoritarian
- Each lens gets: a 2–3 sentence characterisation of how that worldview frames the topic, grounded in the internal logic and values of that perspective
- Perspectives are **charitable** — the strongest, most coherent version of each view, not strawmen
- Each lens is clearly labeled; no lens is privileged or presented as correct
- A light footer disclaimer: *"These are characterisations of ideological perspectives, not official party positions or verified facts."*
- Replies in the **same language as the topic** (same language-mirror rule as `/factcheck`)
- Subject to the same rate limiter as `/factcheck` (shared daily quota)

**Out of scope**
- Custom or free-text lenses — fixed four keeps quality high and scope small; deferred
- Sub-ideologies (centre-left, far-right, green, nationalist) — deferred; start with the four canonical axes
- Sourced citations — this is perspective synthesis, not fact-checking; no web search needed
- Cross-referencing with `/factcheck` results — interesting future feature, deferred
- Saving or recalling past perspectives — no database, consistent with Factomancer's scope
- "Which perspective is correct" or adjudication — explicitly never; the command presents, not judges

## Delivery Milestones
<!-- Status: pending | in-progress | complete -->

| # | Milestone | Outcome | Status | Plan |
|---|---|---|---|---|
| 1 | Four-lens perspectives in Discord | `/perspectives <topic>` returns a formatted embed with all four ideological frames, language-mirrored, charitable, with disclaimer | complete | `.claude/plans/perspectives-command.plan.md` |

## Open Questions
- [ ] Should all four lenses appear in one embed (four fields) or as four separate messages? One embed keeps it compact but may feel crowded. Four messages allows more space per lens but floods the channel.
- [ ] Should `/perspectives` consume from the same global daily limit as `/factcheck`, or have its own separate (cheaper) quota? (No web search = much cheaper per call.)
- [ ] For politically sensitive topics (e.g., abortion, immigration), should the command decline and suggest `/factcheck` instead, or present all four lenses regardless?

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Model produces strawmen for one or more lenses | Medium | Degrades trust in the command | Explicit "charitable, strongest version" instruction in prompt; spot-check across diverse topics |
| Output feels biased toward one lens | Medium | Group stops trusting it | Prompt enforces equal treatment; all lenses same word count and structure |
| Topic is too niche or ambiguous for the model to characterise | Low | Poor output | Graceful fallback: "Could not generate perspectives for this topic — try rephrasing" |
| Users treat perspectives as facts | Low | Misinformation | Footer disclaimer on every response; command name and description make framing explicit |

---
*Status: DRAFT — requirements only. Implementation planning pending via /plan.*
