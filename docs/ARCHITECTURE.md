# Architecture

```
configs/*.yaml ──► batch runner ──► orchestrator (one per game)
                                      │  asks each agent at the right time
                                      ▼
            observation.py ──► agent (LLM via LiteLLM, or scripted) ──► JSON response
                                      │  validated; retry once; then fallback
                                      ▼
                               engine (pure rules) ──► events ──► EventLogger ──► sinks
                                                                     ├─ runs/<batch>/<game>.jsonl
                                                                     └─ Neon (live)
runs/*.jsonl ──► labeler (+ Jev) ──► <game>.labels.jsonl ──► metrics ──► report, leaderboard
                                                         └─► HF Dataset, Databricks
viewer (static) ◄── .jsonl + .labels.jsonl (file, URL, HF dataset or Neon)
```

1. **Engine** owns the true state and the rules. No I/O, no model calls, seeded randomness.
2. **Agents** get only what their role may see, built in `agents/observation.py`. Any model sits behind the same client interface.
3. **Orchestrator** runs the phase loop, validates every response, retries once, then falls back (abstain or a random legal action) and logs the failure.
4. **EventLogger** writes every event to every sink as it happens.
5. **Analysis** runs after games: labels, metrics, report. It never calls the game models.
6. **Viewer** only reads logs. It never talks to models.

The event schema is described in `docs/LOG_SCHEMA.md` (written in T0.2) and generated as `schema/events.schema.json`.
