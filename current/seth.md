# seth status (updated 2026-10-10T18:00Z)
## Active
- T3.3 #19 | agent: implementer (opus) | branch issue-19-metrics | PR #82 | state: in review + HOLD (Seth to confirm metric definitions)
- T3.5 #21 | agent: implementer (sonnet) | branch issue-21-publish | PR #80 | state: in review + HOLD (live HF publish check needs write token + repo name from Seth)
## Queue (next up)
- NOTE for T2.5 #15: batch runner must call Registry.apply_env() (hosted_vllm routing for deepinfra models).
- T2.5 #15 batch runner: waits on Marcus's T1.8 #10.
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
## Codex: n/a
