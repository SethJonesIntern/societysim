#!/usr/bin/env bash
# Creates (or updates) every label and milestone the workflow uses. Safe to re-run.
set -euo pipefail
REPO="${1:-SethJonesIntern/societysim}"

label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; echo "label $1"; }

# Teams
label "team:engine"  "1d76db" "Marcus: engine, agents, orchestrator, logger, Jev, labeler, AMD, Databricks"
label "team:runner"  "0e8a16" "Seth: model client, batch runner, metrics, report, HF publish, Neon"
label "team:viewer"  "d93f0b" "Augustin: replay viewer, Figma, Adobe"
label "team:infra"   "5319e7" "Repo, CI, workflow tooling"

# Status
label "status:ready"       "c2e0c6" "Dependencies merged; free to claim"
label "status:in-progress" "fbca04" "Claimed; an agent or human is working on it"
label "status:review"      "0052cc" "PR open, waiting for the review agent"
label "status:changes"     "e99695" "Reviewer requested changes"
label "status:blocked"     "b60205" "Waiting on another ticket"
label "status:needs-human" "d73a4a" "Agents gave up after 2 review rounds, or a human decision is needed"
label "review:approved"    "0e8a16" "Review agent approved; required by the review-gate check"
label "hold"               "000000" "Do not merge, even if approved"

# Suggested agent
label "agent:codex"  "ededed" "Codex (Marcus's machine)"
label "agent:sonnet" "ededed" "Claude Sonnet implementer"
label "agent:opus"   "ededed" "Claude Opus implementer"
label "agent:cursor" "ededed" "Cursor (Augustin)"
label "agent:gemini" "ededed" "Gemini CLI (Augustin)"
label "agent:human"  "ededed" "Done by a person, not an agent"
label "agent:cloud"  "ededed" "Claude Code cloud session"

# Size and type
label "size:S" "bfdadc" "Under ~1 hour of agent time"
label "size:M" "bfdadc" "1-3 hours of agent time"
label "size:L" "bfdadc" "3+ hours; consider splitting"
label "type:feature" "a2eeef" "New functionality"
label "type:test"    "a2eeef" "Tests only"
label "type:bug"     "d73a4a" "Something is broken"
label "type:chore"   "a2eeef" "Setup, config, tooling"
label "type:docs"    "0075ca" "Documentation"

# Milestones
milestone() {
  if ! gh api "repos/$REPO/milestones?state=all" --jq '.[].title' | grep -qx "$1"; then
    gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null
  fi
  echo "milestone $1"
}
milestone "M0 Setup"                "Repo bootstrap and shared contracts"
milestone "M1 Engine + self-play"   "Deterministic engine, agents, orchestrator, logger; one model in self-play"
milestone "M2 Multi-model + batch"  "Model client, registry, batch runner with rotation and budget cap"
milestone "M3 Labels + metrics"     "Jev classifier, labeler, metrics, report, HF dataset"
milestone "M4 Viewer"               "Replay viewer"
milestone "M5 Experiment + demo"    "Experiments, report, demo prep"
milestone "M6 Sponsor tracks"       "HF, AMD, Neon, Databricks, Figma, Adobe"
