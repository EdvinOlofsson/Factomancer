# PR Message Guidelines

Guidelines for writing pull request messages in this repository.

## Required Headers

### Title

One line, 70 characters max. Imperative mood. Describes *what* the PR does, not *how*.

Format: `<type>: <short description>`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

Examples:
- `feat: add /controversy command with court case and ban tracking`
- `fix: drop fabricated sources when hostname never retrieved`
- `test: add unit tests for controversy parse, verify, format, prompt`

### What does this PR change?

3–5 bullet points. State the concrete changes — new files, modified behaviour, deleted code. No implementation detail unless it is non-obvious. No restating the title.

Example:
- Adds `src/controversy/` module with types, prompt, client, parse, verify, format, and index
- Registers `/controversy` slash command in `src/index.ts` and `src/deploy-commands.ts`
- Updates `CLAUDE.md` with TDD requirements for new command modules
- Gitignores Claude Code harness files (`.agents/`, `.claude/skills/`, `skills-lock.json`)

## Optional Headers

Use these only when they add information not obvious from the diff.

### Why?

Use when the motivation is not self-evident — a constraint, a bug, a stakeholder requirement. Skip for routine feature additions.

### Test plan

Use when the change requires manual verification steps beyond `pnpm test`. List the exact steps.

## Rules

- Write in plain English, no jargon
- Do not pad with "This PR..." or "In this PR..."
- Do not list every file changed — that is what the diff is for
- Do not add a "Co-authored-by" line unless a co-author contributed code
