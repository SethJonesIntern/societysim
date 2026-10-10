import { seatPosition } from "../Table/Table";
import type { Scene } from "../../scene/deriveScene";

interface Arrow {
  actor: string;
  target: string;
  count: number;
  kind: "accusation" | "vote";
  key: string;
}

/** An SVG layer sized to the same square box as Table. Place it inside that box. */
export function Arrows({ scene }: { scene: Scene }) {
  const players = scene.players;
  const index = new Map(players.map((p, i) => [p.id, i]));
  const name = (id: string) => players[index.get(id) ?? -1]?.name ?? id;
  const resultVisible = scene.log.some(
    (e) => e.day === scene.day && (e.type === "elimination" || e.type === "no_elimination"),
  );

  const counts = new Map<string, Arrow>();
  for (const accusation of scene.accusations) {
    const key = `${accusation.actor}:${accusation.target}`;
    const arrow = counts.get(key);
    if (arrow) arrow.count++;
    else counts.set(key, { actor: accusation.actor, target: accusation.target, count: 1, kind: "accusation", key: `accusation:${key}` });
  }
  const arrows = [...counts.values()];
  if (resultVisible) {
    for (const vote of scene.votes) {
      if (vote.target) arrows.push({ actor: vote.actor, target: vote.target, count: 1, kind: "vote", key: `vote:${vote.seq}` });
    }
  }
  arrows.sort((a, b) => (index.get(a.actor) ?? Infinity) - (index.get(b.actor) ?? Infinity)
    || (index.get(a.target) ?? Infinity) - (index.get(b.target) ?? Infinity));

  return (
    <svg
      role="group"
      aria-label="Accusations and revealed votes"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {arrows.map((arrow) => {
        const from = index.get(arrow.actor);
        const to = index.get(arrow.target);
        if (from === undefined || to === undefined || from === to) return null;
        const a = seatPosition(from, players.length);
        const b = seatPosition(to, players.length);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy);
        const ux = dx / length;
        const uy = dy / length;
        const start = { x: a.x + ux * 7, y: a.y + uy * 7 };
        const end = { x: b.x - ux * 8, y: b.y - uy * 8 };
        // Bow each arrow to its own left, votes further out: A→B and B→A, and an accusation and a
        // vote between the same pair, land on separate curves instead of one line.
        const bend = arrow.kind === "vote" ? 8 : 4;
        const ctrl = { x: (start.x + end.x) / 2 - uy * bend, y: (start.y + end.y) / 2 + ux * bend };
        const tx = end.x - ctrl.x;
        const ty = end.y - ctrl.y;
        const tl = Math.hypot(tx, ty);
        const hx = tx / tl;
        const hy = ty / tl;
        const width = arrow.kind === "vote" ? 0.8 : Math.min(0.65 + 0.4 * (arrow.count - 1), 2.5);
        const wing = 1.4 + width;
        const points = [
          `${end.x},${end.y}`,
          `${end.x - hx * 3 - hy * wing},${end.y - hy * 3 + hx * wing}`,
          `${end.x - hx * 3 + hy * wing},${end.y - hy * 3 - hx * wing}`,
        ].join(" ");
        const label = `${name(arrow.actor)} ${arrow.kind === "vote" ? "voted for" : "accused"} ${name(arrow.target)}${arrow.count > 1 ? ` ${arrow.count} times` : ""}`;
        // Colors and the draw-in animation are in viewer.css, keyed on data-kind. pathLength=1 lets the
        // dash animation draw any length. The key has no index, so adding an arrow doesn't redraw the rest.
        return (
          <g key={arrow.key} role="img" aria-label={label} data-kind={arrow.kind} data-count={arrow.count}>
            <path d={`M${start.x},${start.y} Q${ctrl.x},${ctrl.y} ${end.x},${end.y}`} pathLength={1} strokeWidth={width} />
            <polygon points={points} />
          </g>
        );
      })}
      {resultVisible && scene.votes.filter((vote) => vote.target === null).map((vote) => {
        const seat = index.get(vote.actor);
        if (seat === undefined) return null;
        const { x, y } = seatPosition(seat, players.length);
        return (
          <g key={`abstain:${vote.seq}`} role="img" aria-label={`${name(vote.actor)} ${vote.fallback ? "was forced to abstain" : "abstained"}`} data-kind="abstain" data-fallback={vote.fallback}>
            <circle cx={x + 6} cy={y + 6} r="3" />
            <text x={x + 6} y={y + 7.4} textAnchor="middle" fontSize="4">×</text>
          </g>
        );
      })}
    </svg>
  );
}
