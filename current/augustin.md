# augustin status (updated 2026-10-11T04:12Z)
## Active
- PR #532: T299: Play page design: gate check-in, your-turn panel, reveal, and friendly error states - in review
## Queue (next up)
- none
## Done (last 10)
- T299 / PR #532: Play page design pass: illustrated check-in gate, notes seal Turnstile wrapper, your-turn role emblems, countdown clock badge, suspicion chips, and end-of-game reveal cards.
- T481 / PR #483: Illustrated leaderboard styling pass matching Figma tokens (frame 05 / Leaderboard), medals for top 3, segmented tab pills for Detectors/Liars, and self-contained scrollboxes.
- PR #479: Visitor play direct auto-start after bot check verification for Normal and Watch modes.
## Decisions / gotchas
- Visitor play check-in gate uses `gate.css` with night counter header, dealt hand of character cards, Turnstile bot check framed inside notes seal, and smooth fireflies ambience.
- Your-turn panel includes illustrated role emblems, role accent borders, formatted secret dispatch parchment box, urgent countdown clock (<15s crimson pulse), and color-coded suspicion rating chips.
- EndReveal includes victory crest, model avatars in revealed table, and "Who fooled you" deception cards.
- Leaderboard tables wrapped in self-contained horizontal scroll containers (`.leaderboard-scroll` and `.global-leaderboard__scroll`) with gold scrollbars so tables never cause window scroll sideways on desktop.
- Global rankings tabs use segmented pill design (`.global-leaderboard__tablist`, `.global-leaderboard__tab`) with 44px min touch targets and gold gradient active states.
- Medallions for ranks 1–3 use metallic radial gradients.
## Codex: n/a
