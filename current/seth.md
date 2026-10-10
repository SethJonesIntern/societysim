# seth status (updated 2026-10-10T12:30Z)
## Active
- T2.1 #11 | agent: implementer (opus) | branch issue-11-client | PR #70 | state: in review
- T2.4 #14 | agent: implementer (sonnet) | branch issue-14-assign | PR #69 | state: in review
## Queue (next up)
- T2.2 #12 (must set real per-minute limits in models.yaml; #70 guessed gemini 60/hf 300/openai 500), T2.3 #13 (after #11); T2.5 #15 (after Marcus's #10 and #14).
## Done (last 10)
## Decisions / gotchas
- gh is at "C:/Program Files/GitHub CLI" and isn't on the Bash PATH; prepend it.
- PR #69 adds an empty batch/__init__.py (package didn't exist; not in Files touched).
- uv isn't installed here; agents use `python -m uv`.
## Codex: n/a
