# marcus status (updated 2026-10-10T07:45Z)
## Active
- T4.6 #28 mode toggle | agent: codex-implementer, done | branch issue-28-mode-toggle | PR #104 | state: in review
- T4.7b #102 Inspector wolf chat mislabeled | agent: codex-implementer | branch issue-102-inspector-wolf-chat | PR - | state: implementing
- T4.3 #25 speech + chat log | agent: implementer (opus) | branch issue-25-speech-chatlog | PR - | state: implementing
- T4.4 #26 arrows + tally | agent: codex-implementer | branch issue-26-arrows-tally | PR - | state: implementing
- T4.5 #27 label pop-ups | agent: implementer (sonnet), done | branch issue-27-label-popups | PR #105 | state: in review
- T4.8 #30 timeline | agent: codex-implementer, done | branch issue-30-timeline | PR #103 | state: in review (opus; deciding lie-marker scope; implementer's filter edit was classifier-denied, not worked around).
- T6.3 #41 AMD vLLM serve script + amd-* model entry | agent: implementer (opus) | branch issue-41-amd-vllm | PR - | state: implementing (scripts only; Marcus runs on box; cloudflared tunnel for reachability; default model gpt-oss-20b)
## Queue (next up)
- #10 T1.8 play CLI: blocked on Seth's #12 (model registry).
- Other blocked: #37 (needs #20 #21), #38 human (demo), #41 (needs #12), #42 (needs #19 #21 #34).
- Optional later: move shared test game builder from test_leakage.py into conftest; real token count for observation budget.
## Done (last 10)
- T4.2 #24 circle table: PR #101 merged. Handoffs on #25 #26 #27 #33. Unblocked+claimed #25 #26 #27.
- T4.7 #29 inspector: PR #99 merged. Follow-up bug #102 (wolf chat under 'Said publicly').
- T4.1 #23 viewer scaffold (Augustin's team): PR #93 merged. Handoffs posted on #24-#33 #40. Unblocked #24 #28 #29 #30 (claimed by Marcus). Admin TODO: make `viewer` a required CI check.
- T1.4c #85 anti-injection: PR #87 merged (3 rounds). Handoffs on #23 #19.
- T2.2b #83 Gemini sampling (Seth's team): PR #92 merged. Handoffs on #15 #34.
- T1.9b #88 widen sweep: PR #91 merged (243 default games, 657 slow behind SOCIETYSIM_SLOW=1).
- T0.6 #79 contract: meta.usage.cached, schema_version 2: PR #86 merged (2 rounds; cached optional, v1 logs still validate, LOG_SCHEMA.md v2). Handoffs on #15 #19 #20 #23 #39.
- T1.9 #75 invariant sweep: PR #84 merged (240 games, 14/14 mutations caught). Handoffs on #15 #34. Follow-up #88.
- **M1 Engine + self-play COMPLETE (8/8).** T1.8 #10 play CLI: PR #81 merged (2 rounds; fail-fast on missing keys). Handoffs on #15 #34 #23. Marcus told.
- T1.4b #76 test helpers: PR #78 merged (tests/helpers.py).
- T1.6c #74 cached across retries: PR #77 merged (in-memory only). Handoffs on #19 #20. #79 unblocked.
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
- BURN MODE until 06:20 EDT (10:20Z), timer running: cap lifted, use Codex + Claude subagents, file useful follow-ups when queue is empty. Earlier burn window 00:48-01:30 done.
- NEW CONVENTION (Marcus, merged via #47): implementers write a "## Handoff" section in the PR body; after merge, the orchestrator posts each line as an issue comment "**Handoff from #N (PR #M):**" on the target issue. Urgent ones go out right away. Implementers read issue comments before starting. Do this for every merge from now on.
- Workflow verified end to end. Reviewer can't gh pr checkout a branch held by the implementer's worktree, so fetch the head instead.
- T0.2 decisions: seat ids in accuse/vote; one death event each (death_reveal at night end, target null if none, or elimination); wolf turn = wolf_chat then wolf_proposal; meta.usage covers all attempts; response schemas closed, all fields required, no pattern/min/max; mis_elimination labels every voter incl. wolves.
- Marcus: max 3 implementers, one Codex agent, prefer Codex for agent:codex. Only interrupt for needs-human, rate limits, milestones.
- Human setup: collaborators invited, gh scopes OK. .env created by Marcus with all keys except AMD (AMD platform spawn fails: ErrImagePull; #41 waits on AMD support). Agents can't read .env (sandbox). Marcus ran `societysim doctor` himself: all 9 models OK in all 3 modes (HF/OpenAI/Gemini keys good). Jev live test skipped in Marcus's terminal too: pytest doesn't load .env; told him uv run --env-file .env pytest tests/unit/test_jev.py. Gemini 3+ temperature deprecation + stray LiteLLM error filed as #83 (team:runner). Plugins/MCPs unverified.
- Neon project created (id lucky-recipe-36397516, branch production, us-east-2). Data API has NO anon key: requests without an Authorization header run as Postgres role `anonymous` (GRANT USAGE/SELECT; no Neon Auth). Docs conflict on whether it still needs a JWT, so the Neon spike must verify. VITE_NEON_ANON_KEY likely unused. Posted to #39 (grant + verify) and #40 (no anon key, no Authorization header).
- AMD = AUP Learning Cloud Dublin (hosted Jupyter/VSCode GPU, 60k-minute quota, likely no public port). #41 probably runs vLLM on localhost inside the workspace. VSCode Server GPU spawn failed with ErrImagePull (wrong resource; sponsor says use Custom Repos -> Basic GPU Environment) (platform-side, 02:59 EDT); trying LLM Course notebook. Probes done: R9700 32GB gfx1201, Ubuntu 24.04, py3.12 + uv, torch 2.9.1+rocm7.13 OK, no vllm/transformers/docker, HF reachable, 194GB NFS (GPU/VRAM, vllm, HF access). Note posted on #41.
- Keys: Marcus is sharing his OpenAI/Gemini/Typesafe/Neon keys with Seth (Seth uses his own HF_TOKEN), so Seth's batches bill to Marcus's OpenAI/Gemini. Databricks host dbc-b1a3ac7a-8c8d. Rotate all keys after the hackathon.
- Marcus 03:25 EDT: keep going until rate limited, no permission needed. Marcus claimed #23 and #83 himself (classifier blocked me) and is adding Bash(gh issue:*)/Bash(gh pr:*) allow rules. Cross-team work OK: take idle ready tickets from other teams.
- PR #89 (Marcus's README edit): my approve was blocked by the classifier (Self-Approval). Gave Marcus the commands, or he can ask for a reviewer.
- Marcus: if a remaining fix after 2 rounds is small and clear, run round 3 without asking. Only escalate needs-human for real disagreements or large rework.
## Codex: available (2 agents: #10, #74)
