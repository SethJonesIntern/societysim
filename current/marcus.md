# marcus status (updated 2026-10-10T05:44Z)
## Active
- (nothing in flight: every remaining engine/infra ticket is blocked on other teams)
## Queue (next up)
- #10 T1.8 play CLI: blocked on Seth's #12 (model registry).
- M1 is 7/8 done: only #10 T1.8 play CLI left, blocked on Seth's #12 (model registry).
- Other blocked: #37 (needs #20 #21), #38 human (demo), #41 (needs #12), #42 (needs #19 #21 #34).
- Optional later: move shared test game builder from test_leakage.py into conftest; real token count for observation budget.
## Done (last 10)
- T1.7 #9 RandomAgent + integration: PR #68 merged (tested on main with #67; 12 real lone_wolf turns over 30 seeds). Handoff posted on #10.
- T1.6b #65 fallback meta + lone wolf: PR #67 merged (no contract change; meta.action free text). Handoffs on #9 (urgent, earlier) and #23.
- T1.6 #8 orchestrator: PR #63 merged 01:30 EDT (2 rounds; None-color crash fixed). Handoffs posted on #9 #10 #11 #15 #65. #9, #65 ready.
- T1.3b #64 EventLogger zero sinks: PR #66 merged. Handoff posted on #8 #9 #65.
- T1.4 #6 observation + leakage: PR #62 merged (reviewer mutation-tested 10 branches). Handoffs posted on #8 #9. #8 unblocked.
- T1.2 #4 engine.py: PR #61 merged (2 rounds). Self-votes illegal, now in RULES.md. Handoffs posted on #6 #8 #9. #6 unblocked.
- T3.4 #57 Jev resilience: PR #60 merged (2 rounds). Handoffs posted on #19 #21.
- T1.5b #58 prompts zero roles: PR #59 merged. Handoff: none. (Optional nit: 'the wolves talk' plural with 1 wolf.)
- T3.3 #55 Jev wiring: PR #56 merged. Handoff posted on #19. Follow-ups filed #57, #58.
- T1.1 #3 rules/state: PR #54 merged (2 rounds: night-number contract, set->list determinism fix, model shuffle removed). Handoffs posted on #4 #6 #8 #14. #4 unblocked.
- T0.5 #48 chore: PR #53 merged (pythonpath, jsonschema+httpx explicit, PLAN.md seat ids). Handoff: none.
- T3.2 #18 labeler: PR #52 merged. Handoffs posted on #19 #21. Follow-up filed as #55.
- Earlier: T3.1 #17 jev (NEEDS MARCUS live API test), T1.3 #5, T1.5 #7, T0.4 #46, T0.2 #2, T0.3 #43, T0.1 #1.
## Decisions / gotchas
- Burn window (00:48-01:30 EDT) ended; cap lift was for burn mode only. Marcus said keep going (after 01:30): normal loop continues.
- NEW CONVENTION (Marcus, merged via #47): implementers write a "## Handoff" section in the PR body; after merge, the orchestrator posts each line as an issue comment "**Handoff from #N (PR #M):**" on the target issue. Urgent ones go out right away. Implementers read issue comments before starting. Do this for every merge from now on.
- Workflow verified end to end. Reviewer can't gh pr checkout a branch held by the implementer's worktree, so fetch the head instead.
- T0.2 decisions: seat ids in accuse/vote; one death event each (death_reveal at night end, target null if none, or elimination); wolf turn = wolf_chat then wolf_proposal; meta.usage covers all attempts; response schemas closed, all fields required, no pattern/min/max; mis_elimination labels every voter incl. wolves.
- Marcus: max 3 implementers, one Codex agent, prefer Codex for agent:codex. Only interrupt for needs-human, rate limits, milestones.
- Collaborators not invited yet; plugins/MCPs and .env are human setup steps.
## Codex: available
