# seth status (updated 2026-10-10T21:05Z)
## Active
- T2.1b #94 client robustness | agent: implementer (sonnet) | branch issue-94-client-robustness | PR #96 | state: in review
- T2.6 #16 configs | agent: implementer (sonnet) | branch issue-16-configs (stacked on issue-15-batch) | PR #97 | state: HOLD until #90 merges; dry-run being added in #90; caps smoke $1 / selfplay $25 / mixed $40 need Seth OK; review after #90 round 3
- T3.4 #20 report | agent: implementer (sonnet) | branch issue-20-report (stacked on issue-19-metrics) | PR - | state: implementing, PR to get hold until #82 merges
- T2.5 #15 | agent: implementer (sonnet) | branch issue-15-batch | PR #90 | state: changes round 3 (per-model cost estimate w/ price prior; atomic run_meta) + HOLD. 2 failed rounds already; Seth told, continuing for pace
- T3.3 #19 | agent: implementer (opus) | branch issue-19-metrics | PR #82 | state: changes (Seth's metric decisions) + HOLD
- T3.5 #21 | agent: implementer (sonnet) | branch issue-21-publish | PR #80 | state: APPROVED + HOLD (live HF check: HF_TOKEN 'hackathon' has inference scopes only, no repo write; needs Seth's OK + repo name)
## Queue (next up)
- NOTE for T2.5 #15: batch runner must call Registry.apply_env() (hosted_vllm routing for deepinfra models).
## Done (last 10)
- T6.1 #39 Neon sink: PR #73 merged 2026-10-10T07:13Z (live Neon check passed)
- T2.2 #12 registry/doctor: PR #72 merged 2026-10-10T07:03Z (doctor 9/9 live; Seth OK'd orchestrator removing hold)
- T2.3 #13 cache: PR #71 merged 2026-10-10T06:08Z
- T2.1 #11 client: PR #70 merged 2026-10-10T05:59Z
- T2.4 #14 assign: PR #69 merged 2026-10-10T05:57Z
## Decisions / gotchas
- gh is at "C:/Program Files/GitHub CLI" and isn't on the Bash PATH; prepend it.
- PR #69 adds an empty batch/__init__.py (package didn't exist; not in Files touched).
- uv isn't installed here; agents use `python -m uv`.
- Follow-up from #70 review: client.py raises IndexError when a provider returns no choices; should return parsed=None with an error.
- #71: cache replays return CachedUsage(cached=True), but orchestrator _add() rebuilds plain Usage, so the cached flag doesn't reach event meta. Cost reports can't exclude cached calls yet; reviewer says follow-up ticket, not blocker: add cached:bool to Usage + meta.usage (schema bump), keep it in _add, drop CachedUsage. Not filed yet.
- #72: HF model ids, provider pins (esp. Gemma-4-26B) and price overrides are guesses; doctor unverified. No .env on this machine.
- Follow-up (client.py): fail fast without retries on missing credentials (LiteLLM treats it as 500 and retries noisily); return parsed=None on empty choices.
- 2026-10-10 doctor run: HF credits were empty (Seth topped up). HF provider pins wrong for qwen3/llama4/deepseek; gemma id rejected; Gemini ids 404.
- LiteLLM bug: huggingface/deepinfra/<id> posts to router/deepinfra/v1/chat/completions, which HF rejects. Use router.huggingface.co/v1 with model '<id>:deepinfra'. HF token needed Inference Providers scope + Sethery32 credits.
- #73 reviewer: anon SELECT on events (incl. wolf channel/scratchpads) is intended per PLAN T6.2 for replay viewer.
- 2026-10-10: moved #19, #21 (dep #18 merged) and Marcus's #10 (deps #8, #12 merged) from blocked to ready.
- Neon DB (neondb) now holds fixture-0001 test data from the live check (1 game, 118 events, 8 labels); shows in leaderboard. Clean up before real batches.
- pytest doesn't load .env; live Neon test needs NEON_DATABASE_URL exported.
- #15's issue test command uses configs/selfplay_smoke.yaml (a game config, not BatchConfig); needs a #16 batch yaml.
- 2026-10-10 Seth's metric decisions (#82): lies reported for BOTH self_tag and jev side by side; keep 'voted as lie implied' (+ no-lie base rate); detection = last suspicion/day; OpenSkill = equal-weight sides (team mean) + side-advantage dummy, fixed in #82.
- Filed #94 (client robustness, runner) and #95 (cached flag contract, team:engine, for Marcus).
- 2026-10-10: Seth asked for max parallelism until 4:20 reset; stacking #16 on #90 and #20 on #82.
## Codex: n/a
