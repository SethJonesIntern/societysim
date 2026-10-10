@AGENTS.md

## Claude Code specifics

- Subagents live in `.claude/agents/`: `orchestrator` (run as the main session with `claude --agent orchestrator`), `implementer`, `codex-implementer`, `reviewer`.
- A `SessionStart` hook prints your status file (`scripts/status.sh show`) on startup, resume and after compaction. It needs `SOCIETYSIM_MEMBER` (marcus, seth or augustin) set in your own `.claude/settings.local.json`:
  `{"env": {"SOCIETYSIM_MEMBER": "marcus"}}`
- Use the `gh` CLI for GitHub, not the GitHub MCP.
- Skills worth using here: ponytail (code review and leaner code), impeccable (viewer UI), humanizer (README, docs, PR text only).
