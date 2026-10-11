"""Hand-check sample for #611: Jev false_report labels, from a Jev cache only (no API calls).

Reads every game log in BATCH_DIR and the cached Jev answers (default BATCH_DIR/.cache/jev),
counts Jev false_report labels under the old rule (any Jev seer_report) and the new one (also a
Seer claim or first-person check), and prints a seeded sample of the new ones to read by hand.
Writes nothing.

    uv run python scripts/check_jev_false_reports.py runs/mixed_v2_10p [--cache DIR] [-n 20]
"""

import argparse
import random
from pathlib import Path

from societysim.analysis import labeler
from societysim.analysis.jev import cache_dir_for, cached_verdict, parse_response
from societysim.logging.events import EventType


def jev_from_cache(events, cache: Path) -> labeler.Jev:
    results = []
    for s in events:
        if s.type is EventType.STATEMENT:
            data = cached_verdict(cache, s.game_id, s.seq, s.actor, s.public_text or "")
            if data is not None:
                results.append(parse_response(s, data))
    return labeler.jev_verdicts(results)


def false_reports(events, jev) -> list:
    return [
        lb
        for lb in labeler.label_game(events, jev)
        if lb.source == "jev" and lb.label == "false_report"
    ]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("batch_dir", type=Path)
    ap.add_argument("--cache", type=Path)
    ap.add_argument("-n", type=int, default=20)
    ap.add_argument("--seed", type=int, default=611)
    args = ap.parse_args()
    cache = args.cache or cache_dir_for(args.batch_dir)

    games = []
    for log in sorted(args.batch_dir.glob("*.jsonl")):
        if not log.name.endswith(".labels.jsonl"):
            events = labeler.read_log(log)
            if events:
                games.append((events, jev_from_cache(events, cache)))
    covered = sum(len(j) for _, j in games)
    print(f"{len(games)} games, {covered} statements with a cached Jev answer in {cache}")

    new = [(ev, lb) for ev, jev in games for lb in false_reports(ev, jev)]
    gate = labeler._own_report
    labeler._own_report = lambda *_: True  # the rule before #611
    old = sum(len(false_reports(ev, jev)) for ev, jev in games)
    labeler._own_report = gate
    print(f"Jev false_report labels: {old} before #611, {len(new)} after\n")

    for events, lb in random.Random(args.seed).sample(new, min(args.n, len(new))):
        text = next(e.public_text for e in events if e.seq == lb.source_seq)
        print(f"[{lb.game_id} seq {lb.source_seq}] {lb.detail}\n  {text}\n")
    print("Count how many of these are the speaker reporting a check as their own (target: 18+).")


if __name__ == "__main__":
    main()
