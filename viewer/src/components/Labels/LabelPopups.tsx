import type { CSSProperties, ReactNode } from "react";
import type { Label, LabelSource } from "../../data/labels";
import type { Mode, Scene } from "../../scene/deriveScene";

/**
 * Labels to show at this scene: the ones whose source_seq is the current event, filtered by source.
 * Villager mode shows none. Lie labels name hidden roles ("Finn claimed Seer; he is a wolf"), and
 * a label's detail can't be split into public and private parts, so we hide them all.
 * ponytail: could show a label once its truth is public (role revealed at death/game end); not worth it yet.
 */
export function visibleLabels(
  labels: Label[],
  scene: Scene,
  mode: Mode,
  sources?: LabelSource[],
): Label[] {
  if (mode !== "narrator") return [];
  return labels.filter(
    (l) => l.source_seq === scene.seq && (!sources || sources.includes(l.source)),
  );
}

const pretty = (s: string) => s.replace(/_/g, " ");

/**
 * Wraps the Table and overlays one pop-up per label, named for the actor. Colors and the entrance are in viewer.css.
 * The wrapper has the same box as the Table (width 100%, max 640).
 */
export function LabelPopups({
  scene,
  labels,
  mode,
  sources,
  children,
}: {
  scene: Scene;
  labels: Label[];
  mode: Mode;
  sources?: LabelSource[];
  children?: ReactNode;
}) {
  const shown = visibleLabels(labels, scene, mode, sources);
  const name = (id: string) => scene.players.find((p) => p.id === id)?.name ?? id;
  // Pop-ups stack just below the table center (the speech bubble sits just above it), on the
  // table top and off every seat card. They hold no controls, so they never take clicks.
  const stack: CSSProperties = {
    position: "absolute",
    top: "53%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "44%",
    display: "flex",
    flexDirection: "column",
    gap: "0.4em",
    pointerEvents: "none",
  };
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 640 }}>
      {children}
      {/* Always mounted, even empty: screen readers miss live regions that appear with their content. */}
      <div aria-live="polite" style={stack}>
        {shown.map((l, k) => (
          <aside
            key={`${l.label}-${l.source}-${l.actor}-${k}`}
            role="note"
            data-label-for={l.actor}
            data-label-type={l.label}
            data-label-source={l.source}
          >
            <strong>{pretty(l.label)}</strong> · {name(l.actor)}
            <div>
              {pretty(l.source)} · {Math.round(l.confidence * 100)}% confidence
            </div>
            <div>{l.detail}</div>
          </aside>
        ))}
      </div>
    </div>
  );
}
