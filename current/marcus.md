# marcus status (updated 2026-10-10T04:33Z)
## Active
- T0.2 #2 contracts | agent: implementer (opus) | branch issue-2-contracts | PR - | state: implementing (critical path: tell Marcus the moment it merges)
## Queue (next up)
- When T0.2 merges, these become ready: #3 T1.1 (codex), #5 T1.3 (codex), #7 T1.5 (opus), #17 T3.1 (sonnet), #18 T3.2 (opus).
- Wave 1 (critical chain toward #8 orchestrator): #3 -> Codex, #5 -> Sonnet (only one Codex agent), #7 -> Opus. Then #17 and #18 as slots free up. Check Files touched for overlaps first.
- Chain: #3 -> #4 -> #6 -> #8 (needs #5, #7 too) -> #9; #10 also needs #12 (Seth's).
## Done (last 10)
- T0.3 #43 workflow dry run: PR #44 merged by auto-merge 04:33Z. Review-gate went green after review:approved label.
- T0.1 #1 repo bootstrap (closed)
## Decisions / gotchas
- Workflow verified end to end (implementer -> PR -> reviewer -> label -> auto-merge squash). Quirk: reviewer can't gh pr checkout a branch that is checked out in the implementer's worktree; it fetched the head instead.
- Marcus: max 3 implementers, one Codex agent, prefer Codex for agent:codex. Only interrupt for needs-human, rate limits, milestones, and T0.2 merge.
- Collaborators not invited yet; plugins/MCPs and .env are human setup steps.
## Codex: available
