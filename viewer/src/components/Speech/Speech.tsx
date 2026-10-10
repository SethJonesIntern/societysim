import type { CSSProperties, ReactNode } from "react";
import type { Event } from "../../types/events";
import type { Scene } from "../../scene/deriveScene";

/**
 * A statement's text, with fallbacks and truncation marked.
 * Model text is only ever a React text child (escaped), never HTML.
 */
export function SpeechText({ e }: { e: Event }) {
  if (e.meta.fallback)
    return (
      <em data-fallback title="No valid reply; the engine logged a fallback">
        {e.public_text ?? "(silent)"} <small>no valid reply</small>
      </em>
    );
  return (
    <>
      {e.public_text}
      {e.meta.truncated && (
        <>
          … <small data-truncated title="Cut at the word cap">(truncated)</small>
        </>
      )}
    </>
  );
}

/** The statement the bubble shows: the last one in the log, while its speaker holds the floor. */
export function currentStatement(scene: Scene): Event | null {
  if (!scene.speaker) return null;
  return [...scene.log].reverse().find((e) => e.type === "statement" && e.actor === scene.speaker) ?? null;
}

/**
 * Speech bubble overlay. Place it in a `position: relative` box the same size as the Table:
 * it fills that box and anchors the bubble between the speaker's seat and the table center.
 */
export function Speech({ scene }: { scene: Scene }) {
  const e = currentStatement(scene);
  const i = scene.players.findIndex((p) => p.id === e?.actor);
  // The live region stays mounted while empty; screen readers miss regions that appear with their content.
  const live = (bubble?: ReactNode) => (
    <div aria-live="polite" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {bubble}
    </div>
  );
  if (!e || i < 0) return live();
  const p = scene.players[i];
  // Above the table center, growing upward: off every seat card, and clear of the label pop-ups
  // below the center. The speaker's seat glows (data-speaking) and the border is their color.
  // Colors and the entrance are in viewer.css.
  const style: CSSProperties = {
    position: "absolute",
    left: "50%",
    bottom: "51%",
    transform: "translateX(-50%)",
    width: "max-content",
    maxWidth: "44%",
    maxHeight: "32%",
    overflowY: "auto",
    borderColor: p.color,
    pointerEvents: "auto",
  };
  return live(
    <p data-speaker={p.id} data-seq={e.seq} style={style}>
      <strong>{p.name}:</strong> <SpeechText e={e} />
    </p>,
  );
}
