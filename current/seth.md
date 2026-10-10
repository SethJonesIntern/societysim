# seth status (updated 2026-10-11T02:20Z)
## Active
- T5.2 #35 selfplay | PAUSED after 1 game ($0.016): watchdog hit gemma 16/74 invalid (suspicion missing players). Engine issue #136 filed. Seth to choose: continue w/ gemma (30% limit) / drop gemma / wait for #136. NO PAID RUNS while Seth asleep (2026-10-11 night).
- #137 live-test guard (infra) | implementer | no spend
- #138 shared HF router limit | implementer
- #36 mixed cap $40->$10 | implementer (config only, no run)
- #139 report games-vs-seats + base-rate denominator | implementer
- T3.5 #21 | agent: implementer (sonnet) | branch issue-21-publish | PR #80 | state: APPROVED + HOLD (live HF check: HF_TOKEN 'hackathon' has inference scopes only, no repo write; needs Seth's OK + repo name)
## Queue (next up)
- NOTE for T2.5 #15: batch runner must call Registry.apply_env() (hosted_vllm routing for deepinfra models).
## Done (last 10)
- T5.1 #34 smoke: closed 2026-10-10 with results comment (no rerun, Seth's call)
- T2.2b #122 gemma json_schema: PR #125 merged 2026-10-10T08:46Z (live: 8.8% invalid, was 48%)
- T2.6 #16 configs: PR #97 merged 2026-10-10T08:42Z
- T2.5 #15 batch runner: PR #90 merged 2026-10-10T08:34Z (4 review rounds + live smoke)
- T3.4 #20 report: PR #98 merged 2026-10-10 (after #82)
- T3.3 #19 metrics: PR #82 merged 2026-10-10T07:44Z (Seth's metric decisions)
- T2.1b #94 client robustness: PR #96 merged 2026-10-10T07:44Z
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
- Windows MAX_PATH: don't make worktrees under the scratchpad (litellm paths too long).
- Paid tests: only test_real_hf_selfplay (HF_TOKEN) and test_real_jev_on_fixture (TYPESAFE_API_KEY); skipped unless key exported. Proposed live marker + SOCIETYSIM_LIVE=1 guard (awaiting Seth).
- `batch` defaults to --agents scripted (free); real runs need --agents llm.
- Live smoke (runs/smoke_batch, kept locally): invalid output gemma4-26b 48% (suspicion returned as object; json_object mode), deepseek 1%, qwen3 3%. Wolves won 9/10. Calls avg 11-20s; ~8-14 min/game; consider max_concurrency 8 in #97 configs.
- Follow-up idea: huggingface + hosted_vllm both hit the HF router, so up to 16 concurrent calls; consider a shared router limit in models.yaml.
- THROUGHPUT (T5.1): concurrency 4 -> 19 games/h, 20 RPM total (gemma 10, qwen 5.3, deepseek 4.7), no 429s. Game 5-15 min (median ~9), ~$0.02/game (dry-run prior ~4x high). At concurrency 8 expect ~35-40 games/h -> T5.2/T5.3 ~2.5-3h each.
- Gemma remaining invalids are semantic (suspicion missing players). Wolves won 3/3 gemma-only + 9/10 smoke: watch win balance.
- Seth approved caps: selfplay $8, mixed $10 (expected ~$4/$5). amd-gpt-oss-20b excluded: AMD_VLLM_BASE_URL unset here (Marcus's server).
- Free pipeline check: `label --no-jev` + `report` on runs/smoke_batch works end to end. self_tag lie rate deepseek 24%, gemma 19%, qwen3 40%.
## Codex: n/a
