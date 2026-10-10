#!/usr/bin/env bash
# Per-member status files ("current.md") on the unprotected `status` branch.
# Usage: scripts/status.sh show [member] | path [member] | push | init
set -euo pipefail

ROOT="${SOCIETYSIM_ROOT:-$(git -C "$(dirname "$0")" rev-parse --show-toplevel)}"
# Worktrees made by agents live elsewhere; always resolve to the main checkout.
ROOT="$(cd "$(git -C "$ROOT" rev-parse --git-common-dir)/.." && pwd)"
STATUS_DIR="${SOCIETYSIM_STATUS_DIR:-$(dirname "$ROOT")/societysim-status}"
MEMBER="${2:-${SOCIETYSIM_MEMBER:-}}"

ensure_worktree() {
  if [ ! -d "$STATUS_DIR/.git" ] && [ ! -f "$STATUS_DIR/.git" ]; then
    git -C "$ROOT" fetch -q origin status
    git -C "$ROOT" worktree add -q "$STATUS_DIR" status 2>/dev/null \
      || git -C "$ROOT" worktree add -q -B status "$STATUS_DIR" origin/status
  fi
}

sync() { git -C "$STATUS_DIR" pull -q --rebase origin status 2>/dev/null || true; }

case "${1:-show}" in
  init) ensure_worktree; echo "$STATUS_DIR" ;;
  path)
    ensure_worktree
    [ -n "$MEMBER" ] || { echo "Set SOCIETYSIM_MEMBER or pass a member name" >&2; exit 1; }
    echo "$STATUS_DIR/current/$MEMBER.md"
    ;;
  show)
    ensure_worktree; sync
    if [ -n "$MEMBER" ] && [ -f "$STATUS_DIR/current/$MEMBER.md" ]; then
      echo "=== Your status file: $STATUS_DIR/current/$MEMBER.md ==="
      cat "$STATUS_DIR/current/$MEMBER.md"
    fi
    for f in "$STATUS_DIR"/current/*.md; do
      name="$(basename "$f" .md)"
      [ "$name" = "$MEMBER" ] && continue
      echo; echo "=== $name (Active section) ==="
      awk '/^## Active/{on=1; print; next} /^## /{on=0} on' "$f"
    done
    ;;
  push)
    ensure_worktree
    cd "$STATUS_DIR"
    git add current/
    git diff --cached --quiet || git commit -q -m "status: ${SOCIETYSIM_MEMBER:-update} $(date -u +%Y-%m-%dT%H:%MZ)"
    git pull -q --rebase origin status
    git push -q origin status
    echo "status pushed"
    ;;
  *) echo "usage: $0 show [member] | path [member] | push | init" >&2; exit 1 ;;
esac
