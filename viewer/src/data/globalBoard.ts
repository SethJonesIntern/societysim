// Global leaderboard (#344): the Neon views global_detectors and global_liars
// (docs/DATA_CONTRACT.md "Global leaderboard views"), parsed, sorted and polled,
// one view per tab, each loading and failing on its own (#447).
import { useEffect, useState } from "react";
import { neonFetch } from "./neonAuth";

export interface DetectorRow {
  model: string;
  village_games: number;
  suspicion_gap: number | null;
  votes: number;
  wolf_vote_rate: number | null;
  ranked: boolean;
}

export interface LiarRow {
  model: string;
  wolf_games: number;
  suspicion_received: number | null;
  survival_rate: number | null;
  votes_received_per_game: number | null;
  self_tag_lie_voters: number;
  self_tag_lie_success: number | null;
  jev_lie_voters: number;
  jev_lie_success: number | null;
  ranked: boolean;
}

/**
 * One table per tab. Each view loads and fails on its own (#447): a tab is null until its view
 * has loaded once, and `errors` says which tabs failed their last load, keeping their last rows.
 */
export interface GlobalBoard {
  detectors: DetectorRow[] | null;
  liars: LiarRow[] | null;
  errors: Partial<Record<BoardTab, string>>;
}

export const EMPTY_BOARD: GlobalBoard = { detectors: null, liars: null, errors: {} };

export type BoardTab = "detectors" | "liars";
export const BOARD_TABS: readonly { id: BoardTab; label: string }[] = [
  { id: "detectors", label: "Detectors" },
  { id: "liars", label: "Liars" },
];

/** How often the board is re-read while the tab is visible. */
export const POLL_MS = 45_000;
/** A view that hasn't answered by then counts as failed for this poll. */
export const VIEW_TIMEOUT_MS = 15_000;

type Raw = Record<string, unknown>;
// numeric columns may arrive as strings ("0.571").
const num = (v: unknown): number | null => (v === null || v === undefined || v === "" ? null : Number(v));
const int = (v: unknown): number => Number(v ?? 0);

export const parseDetector = (r: Raw): DetectorRow => ({
  model: String(r.model),
  village_games: int(r.village_games),
  suspicion_gap: num(r.suspicion_gap),
  votes: int(r.votes),
  wolf_vote_rate: num(r.wolf_vote_rate),
  ranked: r.ranked === true,
});

export const parseLiar = (r: Raw): LiarRow => ({
  model: String(r.model),
  wolf_games: int(r.wolf_games),
  suspicion_received: num(r.suspicion_received),
  survival_rate: num(r.survival_rate),
  votes_received_per_game: num(r.votes_received_per_game),
  self_tag_lie_voters: int(r.self_tag_lie_voters),
  self_tag_lie_success: num(r.self_tag_lie_success),
  jev_lie_voters: int(r.jev_lie_voters),
  jev_lie_success: num(r.jev_lie_success),
  ranked: r.ranked === true,
});

/** Ranked rows first; then by `key` (best first, nulls last); then by model name. */
function rank<T extends { model: string; ranked: boolean }>(rows: T[], key: (r: T) => number | null, higherIsBetter: boolean): T[] {
  return [...rows].sort((a, b) => {
    if (a.ranked !== b.ranked) return a.ranked ? -1 : 1;
    const x = key(a);
    const y = key(b);
    if (x !== y) {
      if (x === null) return 1;
      if (y === null) return -1;
      return higherIsBetter ? y - x : x - y;
    }
    return a.model.localeCompare(b.model);
  });
}

/** Best detector: the largest suspicion gap (wolves rated higher than everyone else). */
export const sortDetectors = (rows: DetectorRow[]) => rank(rows, (r) => r.suspicion_gap, true);
/** Best liar: the least suspicion received as a wolf. */
export const sortLiars = (rows: LiarRow[]) => rank(rows, (r) => r.suspicion_received, false);

async function get(path: string): Promise<Raw[]> {
  const res = await neonFetch(`/${path}`, { signal: AbortSignal.timeout(VIEW_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Neon ${path.split("?")[0]}: HTTP ${res.status}`);
  return (await res.json()) as Raw[];
}

export const loadDetectors = async () => sortDetectors((await get("global_detectors?select=*")).map(parseDetector));
export const loadLiars = async () => sortLiars((await get("global_liars?select=*")).map(parseLiar));

/** One loader per tab; `useGlobalBoard` runs them side by side and never lets one wait on the other. */
export interface BoardLoaders {
  detectors: () => Promise<DetectorRow[]>;
  liars: () => Promise<LiarRow[]>;
}
export const NEON_LOADERS: BoardLoaders = { detectors: loadDetectors, liars: loadLiars };

// AbortSignal.timeout rejects with a DOMException named TimeoutError.
const reason = (e: unknown) =>
  (e as { name?: unknown } | null)?.name === "TimeoutError" ? "timed out" : e instanceof Error ? e.message : String(e);

// --- display: the columns each tab shows, so the component only renders --------------------

export interface Column<T> {
  label: string;
  title: string;
  value: (r: T) => string;
}

const pct = (x: number | null) => (x === null ? "n/a" : `${Math.round(x * 100)}%`);
const dec = (x: number | null) => (x === null ? "n/a" : x.toFixed(2));
const withN = (x: number | null, n: number) => `${pct(x)} (n=${n})`;

export const DETECTOR_COLUMNS: Column<DetectorRow>[] = [
  { label: "Model", title: "", value: (r) => r.model },
  { label: "Games", title: "Seat-games on the village side", value: (r) => String(r.village_games) },
  {
    label: "Suspicion gap",
    title: "Mean suspicion given to wolves minus mean given to everyone else (1 perfect, 0 guessing)",
    value: (r) => dec(r.suspicion_gap),
  },
  { label: "Wolf votes", title: "Share of its day votes that hit a wolf", value: (r) => withN(r.wolf_vote_rate, r.votes) },
];

export const LIAR_COLUMNS: Column<LiarRow>[] = [
  { label: "Model", title: "", value: (r) => r.model },
  { label: "Games", title: "Seat-games as a wolf", value: (r) => String(r.wolf_games) },
  { label: "Suspicion", title: "Mean suspicion it got from non-wolves as a wolf (lower is better)", value: (r) => pct(r.suspicion_received) },
  { label: "Survived", title: "Share of its wolf games it was never eliminated or killed", value: (r) => pct(r.survival_rate) },
  { label: "Votes/game", title: "Day votes against it per wolf game", value: (r) => dec(r.votes_received_per_game) },
  {
    label: "Lie success (self-tag)",
    title: "Share of later same-day votes that went the way its self-tagged lies pointed",
    value: (r) => withN(r.self_tag_lie_success, r.self_tag_lie_voters),
  },
  {
    label: "Lie success (Jev)",
    title: "The same, for lies Jev labelled",
    value: (r) => withN(r.jev_lie_success, r.jev_lie_voters),
  },
];

// --- polling ---------------------------------------------------------------------------------

/**
 * Loads both tabs now and every `intervalMs` while the page is visible. Each tab's result lands
 * as soon as its view answers; a failed tab keeps its last rows and gets an entry in `errors`.
 * A hidden tab stops polling; it reloads at once when the tab is shown again.
 */
export function useGlobalBoard(loaders: BoardLoaders = NEON_LOADERS, intervalMs = POLL_MS): GlobalBoard {
  const [board, setBoard] = useState<GlobalBoard>(EMPTY_BOARD);

  useEffect(() => {
    let stopped = false;
    let busy = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const loadTab = async <K extends BoardTab>(tab: K, load: () => Promise<GlobalBoard[K]>) => {
      try {
        const rows = await load();
        if (stopped) return;
        setBoard((b) => {
          const errors = { ...b.errors };
          delete errors[tab];
          return { ...b, [tab]: rows, errors };
        });
      } catch (e) {
        if (!stopped) setBoard((b) => ({ ...b, errors: { ...b.errors, [tab]: reason(e) } }));
      }
    };
    const tick = async () => {
      timer = undefined;
      if (stopped || busy || document.hidden) return; // a hidden tab resumes on visibilitychange
      busy = true;
      await Promise.all([loadTab("detectors", loaders.detectors), loadTab("liars", loaders.liars)]);
      busy = false;
      if (!stopped && !document.hidden) timer = setTimeout(tick, intervalMs);
    };
    const onVisibility = () => {
      if (!document.hidden && timer === undefined) void tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loaders, intervalMs]);

  return board;
}
