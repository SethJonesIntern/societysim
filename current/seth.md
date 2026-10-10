# seth status (updated 2026-10-10T13:40Z)
## Active
- T2.2 #12 | agent: implementer (sonnet) | branch issue-12-registry | PR #72 | state: re-review round 2 + HOLD (Seth must run `societysim doctor` with real keys, fix/drop failing models, then remove hold)
- T2.3 #13 | agent: implementer (sonnet) | branch issue-13-cache | PR #71 | state: re-review round 2
## Queue (next up)
- T2.5 #15 batch runner: waits on Marcus's T1.8 #10.
## Done (last 10)
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
## Codex: n/a
