# AGENTS.md

This is the shared guide for every agent and every human on this repo: Claude Code, Codex, Cursor and Gemini CLI. Read it before touching anything. The full plan, with every ticket's detail, is in [docs/PLAN.md](docs/PLAN.md). Game rules are in [docs/RULES.md](docs/RULES.md).

## What we're building

LLM agents from different providers play Werewolf. A deterministic Python engine owns the true game state. Agents only return JSON: a private scratchpad (with a suspicion score for every other living player) and a public action. Every event goes to a JSONL log. Later passes label lies from the log, compute per-model metrics, and a static React viewer replays games.

## Hard rules

1. **The engine is deterministic.** `src/societysim/engine/` does no I/O and makes no LLM calls. All randomness comes from one `random.Random(seed)`.
2. **No information leaks.** Prompts are built only in `agents/observation.py`. Players see only what their role allows. Wolves see the wolf channel; nobody else does. Leakage tests must stay green.
3. **Contracts are shared.** The event schema (`logging/events.py` → `schema/events.schema.json` → `viewer/src/types/events.ts`), agent response schemas (`agents/schemas.py`) and the model client Protocol are used by all three teams. Changing them needs its own ticket, a `schema_version` bump, and regenerated schema files in the same PR.
4. **`actor` and `target` in events are seat ids** (`p0`…`p8`), never names.
5. **The raw game log is never edited.** Labels go in `<game_id>.labels.jsonl` next to it.
6. **No secrets in git.** Keys live in `.env` (see `.env.example`).
7. **Stay inside your ticket.** Only touch the files listed under "Files touched". If you need to change something outside it, say so in the PR and don't do it.
8. **Human-facing text sounds human.** README, docs, PR and issue text: plain and direct, no filler. Claude users can run the humanizer skill on it. Never run humanizer on game prompts or model outputs.

## Commands

```bash
uv sync --frozen                      # install (lockfile is committed)
uv run ruff check && uv run ruff format --check
uv run pytest
uv run societysim --help
# viewer (once viewer/ exists)
cd viewer && npm ci && npm run build && npm test
```

## Repo map

| Path | What lives there | Team |
|---|---|---|
| `src/societysim/engine/` | state, rules, engine (pure) | engine |
| `src/societysim/agents/` | response schemas, prompts, observations, LLM and scripted agents | engine |
| `src/societysim/orchestrator.py` | phase loop, validation, retry once, fallback | engine |
| `src/societysim/logging/` | Event model, EventLogger, sinks (JSONL, Neon) | engine (Neon sink: runner) |
| `src/societysim/models/` | LiteLLM client, model registry, response cache | runner |
| `src/societysim/batch/` | parallel batch runner, seat/role rotation | runner |
| `src/societysim/analysis/` | Jev, labeler (engine); metrics, report, publish (runner) | both |
| `configs/` | models.yaml, game and batch configs | runner |
| `schema/`, `fixtures/` | generated JSON schema; hand-written sample game log | engine |
| `viewer/` | React + Vite + TS replay viewer | viewer |
| `neon/`, `infra/`, `notebooks/` | sponsor tracks (Neon, AMD, Databricks) | see tickets |

## Ticket workflow

GitHub issues are the task list. Each one has Goal, Acceptance criteria, Files touched, Test command, Depends on, Out of scope.

1. **Check what others are doing.** Read the status files: `scripts/status.sh show` (they live on the `status` branch, one per person: `current/marcus.md`, `current/seth.md`, `current/augustin.md`).
2. **Claim.** Pick a `status:ready` issue with your `team:*` label whose dependencies are merged.
   `gh issue edit N --add-assignee @me --add-label status:in-progress --remove-label status:ready`, then re-read the issue. If someone else is the assignee, back off.
3. **Branch.** `issue-N-<short-slug>` from fresh `origin/main`. If the branch already exists (resuming), `git checkout -B issue-N-<slug> origin/issue-N-<slug>`.
4. **Work.** Write tests with the code. Commit and push WIP after each logical step, so an interrupted session loses little.
5. **Before the PR.** `git fetch && git rebase origin/main`, then lint and tests must pass.
6. **PR.** `gh pr create --title "T<id>: ..." --body "Closes #N ..." --label status:review`. Use `.github/PULL_REQUEST_TEMPLATE.md`. Keep PRs to one ticket.
7. **Review.** A review agent checks it. Approval means the label `review:approved`, and the PR auto-merges (squash) once CI and the `review-gate` check are green. A new push removes the label and needs another review. `hold` blocks merging.
8. **After merge.** The issue closes itself. Whoever merged a ticket moves its dependents from `status:blocked` to `status:ready` when all their dependencies are merged.

## Labels

- Team: `team:engine` (Marcus), `team:runner` (Seth), `team:viewer` (Augustin), `team:infra`
- Status: `status:ready|in-progress|review|changes|blocked|needs-human`, `review:approved`, `hold`
- Suggested agent: `agent:codex|sonnet|opus|cursor|gemini|human|cloud`
- `size:S|M|L`, `type:feature|test|bug|chore|docs`. Milestones M0–M6.

## Code style

- Python 3.12, Pydantic v2 models for anything that crosses a boundary, `async` for anything that calls a model.
- Small modules, plain functions where a class isn't needed. Don't add abstractions a ticket doesn't ask for.
- Validate at boundaries (model outputs, config files); trust internal data.
- Tests: pytest, `pytest-asyncio` (auto mode). No real API calls in tests; use the fake client or recorded responses.
- Viewer: TypeScript strict, pure reducer `deriveScene(events, idx, mode)` for all game state, components only render.

## Review guidelines (used by review agents and by Codex review)

- Does the PR meet every acceptance criterion in its issue, and only touch listed files?
- Does it keep the hard rules above (determinism, no leaks, contracts, seat ids)?
- Are the tests real (they would fail if the code were wrong)?
- Flag only real problems: bugs, rule breaks, missing tests. Skip style nits that ruff doesn't catch.
