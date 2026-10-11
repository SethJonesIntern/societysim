import { useState } from "react";
import { ModelAvatar, useModelLabel } from "../ModelAvatar/ModelAvatar";
import { BOARD_TABS, DETECTOR_COLUMNS, LIAR_COLUMNS, type BoardTab, type Column, type GlobalBoard } from "../../data/globalBoard";

export interface GlobalLeaderboardProps {
  board: GlobalBoard;
  initialTab?: BoardTab;
}

/**
 * Unstyled global leaderboard with two tabs. Feed it from `useGlobalBoard()`. Each tab shows its
 * own state: loading, its table, or "temporarily unavailable" when its view failed (#447), so one
 * failing view never hides the other. Rows below the games threshold carry `data-ranked="false"`;
 * style via the data attributes.
 */
export function GlobalLeaderboard({ board, initialTab = "detectors" }: GlobalLeaderboardProps) {
  const [tab, setTab] = useState<BoardTab>(initialTab);
  const failed = board.errors[tab];
  return (
    <section className="global-leaderboard" data-tab={tab}>
      <div role="tablist" aria-label="Leaderboard">
        {BOARD_TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === tab} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "detectors" ? (
        <TabBody rows={board.detectors} failed={failed} columns={DETECTOR_COLUMNS} caption="Best wolf detectors, as villagers" />
      ) : (
        <TabBody rows={board.liars} failed={failed} columns={LIAR_COLUMNS} caption="Best liars, as wolves" />
      )}
    </section>
  );
}

interface TabBodyProps<T> {
  rows: T[] | null;
  /** Why this tab's last load failed, if it did. */
  failed: string | undefined;
  columns: Column<T>[];
  caption: string;
}

function TabBody<T extends { model: string; ranked: boolean }>({ rows, failed, columns, caption }: TabBodyProps<T>) {
  if (rows === null) {
    return failed ? (
      <p role="status" data-error={failed}>
        This ranking is temporarily unavailable. It will try again shortly.
      </p>
    ) : (
      <p>Loading the leaderboard…</p>
    );
  }
  return (
    <>
      {failed && (
        <p role="status" data-error={failed}>
          Couldn't refresh this ranking just now, so it shows the last copy.
        </p>
      )}
      <Table rows={rows} columns={columns} caption={caption} />
    </>
  );
}

function Table<T extends { model: string; ranked: boolean }>({ rows, columns, caption }: { rows: T[]; columns: Column<T>[]; caption: string }) {
  const label = useModelLabel();
  if (rows.length === 0) return <p>No finished games yet.</p>;
  return (
    <table role="tabpanel">
      <caption>{caption}. Models with fewer than 5 games are listed last, unranked.</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.label} scope="col" title={c.title || undefined}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.model} data-ranked={r.ranked}>
            {columns.map((c, i) =>
              i === 0 ? (
                <th key={c.label} scope="row">
                  {c.label === "Model" && <ModelAvatar model={r.model} label={label(r.model)} size={28} />}{" "}
                  {c.label === "Model" ? label(r.model) : c.value(r)}
                </th>
              ) : (
                <td key={c.label}>{c.value(r)}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
