import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EMPTY_BOARD, type GlobalBoard } from "../../data/globalBoard";
import { GlobalLeaderboard } from "./GlobalLeaderboard";

const board: GlobalBoard = {
  detectors: [
    { model: "a", village_games: 7, suspicion_gap: 0.45, votes: 8, wolf_vote_rate: 0.5, ranked: true },
    { model: "few", village_games: 2, suspicion_gap: 0.9, votes: 3, wolf_vote_rate: 1, ranked: false },
  ],
  liars: [
    {
      model: "y",
      wolf_games: 6,
      suspicion_received: 0.3,
      survival_rate: 0.833,
      votes_received_per_game: 1,
      self_tag_lie_voters: 0,
      self_tag_lie_success: null,
      jev_lie_voters: 4,
      jev_lie_success: 0.75,
      ranked: true,
    },
  ],
  errors: {},
};

const render = (props: Partial<React.ComponentProps<typeof GlobalLeaderboard>> = {}) =>
  renderToStaticMarkup(React.createElement(GlobalLeaderboard, { board, ...props }));

describe("GlobalLeaderboard", () => {
  it("shows the Detectors tab by default, with unranked rows marked", () => {
    const html = render();
    expect(html).toContain('aria-selected="true">Detectors');
    expect(html).toContain("<td>0.45</td><td>50% (n=8)</td>");
    expect(html).toMatch(/<tr data-ranked="false"><th scope="row">.*few/);
    expect(html).not.toContain("Lie success");
  });

  it("shows the Liars tab", () => {
    const html = render({ initialTab: "liars" });
    expect(html).toContain('aria-selected="true">Liars');
    expect(html).toContain("<td>30%</td><td>83%</td><td>1.00</td><td>n/a (n=0)</td><td>75% (n=4)</td>");
  });

  it("loading and empty states", () => {
    expect(render({ board: EMPTY_BOARD })).toContain("Loading the leaderboard");
    expect(render({ board: { detectors: [], liars: [], errors: {} } })).toContain("No finished games yet.");
  });

  // #447: global_liars timed out (HTTP 500) while global_detectors answered.
  const liarsDown: GlobalBoard = { ...board, liars: null, errors: { liars: "Neon global_liars: HTTP 500" } };

  it("a failed liars view leaves the detectors tab working", () => {
    const html = render({ board: liarsDown });
    expect(html).toContain("<td>0.45</td><td>50% (n=8)</td>");
    expect(html).not.toContain("temporarily unavailable");
    expect(html).not.toContain('role="alert"');
  });

  it("the failed tab says it is temporarily unavailable", () => {
    const html = render({ board: liarsDown, initialTab: "liars" });
    expect(html).toContain("This ranking is temporarily unavailable.");
    expect(html).not.toContain("Loading the leaderboard");
    expect(html).not.toContain("<table");
  });

  it("a tab that fails a later poll keeps its last rows", () => {
    const html = render({ board: { ...board, errors: { detectors: "timed out" } } });
    expect(html).toContain("Couldn&#x27;t refresh this ranking just now");
    expect(html).toContain("<td>0.45</td>");
  });
});
