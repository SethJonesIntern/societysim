# seth status (updated 2026-10-10T12:55Z)
## Active
- T2.2 #12 | agent: implementer (sonnet) | branch issue-12-registry | PR - | state: implementing
- T2.3 #13 | agent: implementer (sonnet) | branch issue-13-cache | PR - | state: implementing
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
## Codex: n/a
