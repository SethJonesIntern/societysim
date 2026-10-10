# seth status (updated 2026-10-10T16:10Z)
## Active
- T6.1 #39 | agent: implementer (sonnet) | branch issue-39-neon | PR - | state: implementing
## Queue (next up)
- NOTE for T2.5 #15: batch runner must call Registry.apply_env() (hosted_vllm routing for deepinfra models).
- T2.5 #15 batch runner: waits on Marcus's T1.8 #10.
## Done (last 10)
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
## Codex: n/a
