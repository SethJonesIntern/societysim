# augustin status (updated 2026-10-11T03:22Z)
## Active
- PR #483: T481: Illustrated leaderboard styling and global rankings tabs (frame 05) - in review
## Queue (next up)
- #299 Play page design: Normal / Watch / Advanced, Your-turn panel, reveal, errors
## Done (last 10)
- T481 / PR #483: Illustrated leaderboard styling pass matching Figma tokens (frame 05 / Leaderboard), medals for top 3, segmented tab pills for Detectors/Liars, and self-contained scrollboxes.
- PR #479: Visitor play direct auto-start after bot check verification for Normal and Watch modes.
## Decisions / gotchas
- Leaderboard tables wrapped in self-contained horizontal scroll containers (`.leaderboard-scroll` and `.global-leaderboard__scroll`) with gold scrollbars so tables never cause window scroll sideways on desktop.
- Global rankings tabs use segmented pill design (`.global-leaderboard__tablist`, `.global-leaderboard__tab`) with 44px min touch targets and gold gradient active states.
- Medallions for ranks 1–3 use metallic radial gradients.
## Codex: n/a
