# marcus status (updated 2026-10-10T04:53Z)
## Active
- T1.1 #3 rules/state | agent: codex-implementer | branch issue-3-rules-state | PR - | state: implementing
- T1.3 #5 EventLogger | agent: implementer (sonnet) | branch issue-5-event-logger | PR #49 | state: round 1 fixed, re-review round 2 running
- T1.5 #7 prompts | agent: implementer (opus), done | branch issue-7-prompts | PR #50 | state: in review (opus). Handoff lines for #6 and #8 in PR body.
- T3.1 #17 jev | agent: implementer (opus), done | branch issue-17-jev | PR #51 | state: in review (opus). Real-API test skipped (no TYPESAFE_API_KEY); needs a live check by someone with the key.
- T3.2 #18 labeler | agent: implementer (opus) | branch issue-18-labeler | PR - | state: implementing
## Queue (next up)
- #48 T0.5 chore (pythonpath, jsonschema dep, PLAN.md seat ids): blocked on #5.
- Chain: #3 -> #4 -> #6 -> #8 (needs #5, #7) -> #9; #10 also needs Seth's #12. #39 (Seth) needs #5.
## Done (last 10)
- T0.4 #46 handoff convention: PR #47 merged (2 review rounds). Now in AGENTS.md + agent defs on main. Handoff: none.
- T0.2 #2 contracts: PR #45 merged ~04:50Z. Unblocked #3 #5 #7 #11 #14 #17 #18 #23. Posted handoff comments on #5 #7 #11 #14 #18 #23. Marcus told.
- T0.3 #43 workflow dry run: PR #44 auto-merged 04:33Z.
- T0.1 #1 repo bootstrap (closed)
## Decisions / gotchas
- Marcus 00:48 EDT: burn tokens until 01:30 EDT (05:30Z). Timer running. Use opus implementers. Marcus lifted the 3-implementer cap (burn mode): dispatch everything ready.
- NEW CONVENTION (Marcus, merged via #47): implementers write a "## Handoff" section in the PR body; after merge, the orchestrator posts each line as an issue comment "**Handoff from #N (PR #M):**" on the target issue. Urgent ones go out right away. Implementers read issue comments before starting. Do this for every merge from now on.
- Workflow verified end to end. Reviewer can't gh pr checkout a branch held by the implementer's worktree, so fetch the head instead.
- T0.2 decisions: seat ids in accuse/vote; one death event each (death_reveal at night end, target null if none, or elimination); wolf turn = wolf_chat then wolf_proposal; meta.usage covers all attempts; response schemas closed, all fields required, no pattern/min/max; mis_elimination labels every voter incl. wolves.
- Deferred chores (from T0.2 review): pythonpath=["tests"] in pyproject; make jsonschema explicit dep; docs/PLAN.md:143-144 says names for accuse/vote, should say seat ids. Candidate small ticket.
- Marcus: max 3 implementers, one Codex agent, prefer Codex for agent:codex. Only interrupt for needs-human, rate limits, milestones.
- Collaborators not invited yet; plugins/MCPs and .env are human setup steps.
- #48 chore also gets explicit httpx dep (commented on #48).
## Codex: available (in use on #3)
