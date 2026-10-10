import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "../../../fixtures/sample_game.jsonl?raw";
import labelsText from "../../../fixtures/sample_game.labels.jsonl?raw";
import { LeaderboardTable } from "../pages/Leaderboard";
import { neonSource } from "./neonSource";
import { parseLog } from "./parse";

const API = "https://ep-x.apirest.neon.test/neondb/rest/v1";
const rows = fixture
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => ({ event: JSON.parse(l) }));

/** Fake Data API: answers by table, filters events by seq=gt.N like PostgREST. Records every request. */
function serve(tables: Record<string, unknown[]>, status = 200) {
  const asked: { url: string; auth: string | undefined }[] = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    asked.push({ url, auth: (init?.headers as Record<string, string> | undefined)?.Authorization });
    const u = new URL(url);
    const table = u.pathname.split("/").at(-1)!;
    let body = tables[table] ?? [];
    const gt = u.searchParams.get("seq")?.match(/^gt\.(-?\d+)$/);
    if (gt) body = body.filter((r) => (r as { event: { seq: number } }).event.seq > Number(gt[1]));
    return new Response(JSON.stringify(body), { status });
  });
  return asked;
}

afterEach(() => vi.unstubAllGlobals());

describe("neonSource", () => {
  it("loads a game from jsonb rows exactly as the .jsonl parses, sending no auth header without a key", async () => {
    const asked = serve({ events: rows });
    const log = await neonSource(API + "/").loadGame("fixture-0001");
    expect(log).toEqual(parseLog(fixture));
    expect(asked[0].url).toBe(`${API}/events?select=event&game_id=eq.fixture-0001&order=seq`);
    expect(asked[0].auth).toBeUndefined();
  });

  it("sends the key as a bearer token when one is set", async () => {
    const asked = serve({ games: [] });
    await neonSource(API, "jwt123").listGames();
    expect(asked[0].auth).toBe("Bearer jwt123");
  });

  it("reports malformed rows instead of passing them to the scene", async () => {
    serve({ events: [rows[0], { event: { ...rows[1].event, actor: "Ava" } }, rows[2]] });
    const log = await neonSource(API).loadGame("g");
    expect(log.events.map((e) => e.seq)).toEqual([0, 2]);
    expect(log.errors).toEqual([{ line: 2, error: "actor must be a seat id or null" }]);
  });

  it("polls only events after the given seq", async () => {
    const asked = serve({ events: rows });
    const more = await neonSource(API).pollEvents("fixture-0001", 115);
    expect(more.map((e) => e.seq)).toEqual([116, 117]);
    expect(asked[0].url).toContain("&seq=gt.115&");
  });

  it("lists games with model names only, never roles or winners", async () => {
    const asked = serve({
      games: [
        { game_id: "g2", models: { p0: { model: "qwen", role: "wolf" }, p1: { model: "llama", role: "seer" } } },
        { game_id: "g1", models: ["qwen", "qwen", "llama"] },
        { game_id: "g0", models: null },
      ],
    });
    const games = await neonSource(API).listGames();
    expect(games).toEqual([
      { id: "g2", models: ["llama", "qwen"] },
      { id: "g1", models: ["llama", "qwen"] },
      { id: "g0", models: undefined },
    ]);
    expect(JSON.stringify(games)).not.toMatch(/wolf|seer|winner/);
    expect(asked[0].url).not.toMatch(/winner|status/);
  });

  it("loads labels, and treats a failed request as no labels", async () => {
    const labels = labelsText
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => ({ label: JSON.parse(l) }));
    serve({ labels });
    expect(await neonSource(API).loadLabels!("fixture-0001")).toHaveLength(labels.length);
    serve({}, 401);
    expect(await neonSource(API).loadLabels!("fixture-0001")).toEqual([]);
  });

  it("surfaces HTTP errors from listGames and loadGame", async () => {
    serve({}, 401);
    await expect(neonSource(API).listGames()).rejects.toThrow("Neon games: HTTP 401");
    await expect(neonSource(API).loadGame("g")).rejects.toThrow("Neon events: HTTP 401");
  });

  it("builds a leaderboard Board from the SQL view that LeaderboardTable renders", async () => {
    serve({
      leaderboard: [
        { model: "qwen", seat_games: 6, wins: 4, win_rate: "0.667" },
        { model: "llama", seat_games: 3, wins: 0, win_rate: 0 },
      ],
      games: [{ game_id: "a" }, { game_id: "b" }],
    });
    const board = await neonSource(API).loadBoard();
    expect(board.games).toBe(2);
    expect(board.models.map((r) => [r.model, r.games, r.win_rate])).toEqual([
      ["qwen", 6, 0.667],
      ["llama", 3, 0],
    ]);
    const html = renderToStaticMarkup(createElement(LeaderboardTable, { board }));
    expect(html).toContain("Ranked by win rate");
    expect(html).toContain("<td>67%</td>");
  });
});
