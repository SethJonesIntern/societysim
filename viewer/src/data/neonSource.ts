import type { Board } from "../pages/Leaderboard";
import { parseLabels } from "./labels";
import { parseLog } from "./parse";
import type { GameSource, GameSummary } from "./source";

/**
 * GameSource over the Neon Data API (PostgREST), reading the tables in neon/schema.sql.
 * `key` is optional: with none, requests carry no Authorization header and Neon runs them as the
 * read-only `anonymous` role. Set it (VITE_NEON_ANON_KEY) if the Data API turns out to need a JWT.
 * `url` can also point at a read-only proxy that serves the same PostgREST paths.
 */
export function neonSource(url: string, key?: string): GameSource & { loadBoard(): Promise<Board> } {
  const base = url.replace(/\/+$/, "");
  const headers: Record<string, string> = key ? { Authorization: `Bearer ${key}` } : {};
  const get = async <T>(path: string): Promise<T[]> => {
    const res = await fetch(`${base}/${path}`, { headers });
    if (!res.ok) throw new Error(`Neon ${path.split("?")[0]}: HTTP ${res.status}`);
    return (await res.json()) as T[];
  };
  const gid = (id: string) => `game_id=eq.${encodeURIComponent(id)}`;
  // Rows hold the full event as jsonb; parseLog gives them the same envelope check as a .jsonl file.
  const events = async (query: string) =>
    parseLog((await get<{ event: unknown }>(`events?select=event&${query}&order=seq`)).map((r) => JSON.stringify(r.event)).join("\n"));

  return {
    // Only id and models: roles and winners are spoilers and never leave the database here.
    listGames: async () =>
      (await get<{ game_id: string; models: unknown }>("games?select=game_id,models&order=started_at.desc.nullslast")).map(
        (g): GameSummary => ({ id: g.game_id, models: modelNames(g.models) }),
      ),
    loadGame: (id) => events(gid(id)),
    pollEvents: async (id, afterSeq) => (await events(`${gid(id)}&seq=gt.${afterSeq}`)).events,
    loadLabels: async (id) => {
      try {
        const rows = await get<{ label: unknown }>(`labels?select=label&${gid(id)}&order=idx`);
        return parseLabels(rows.map((r) => JSON.stringify(r.label)).join("\n"));
      } catch {
        return []; // same as a missing labels file: the viewer shows none
      }
    },
    loadBoard: async () => {
      const [rows, finished] = await Promise.all([
        get<{ model: string; seat_games: number; win_rate: number | string | null }>(
          "leaderboard?select=model,seat_games,win_rate&order=win_rate.desc.nullslast",
        ),
        get<unknown>("games?select=game_id&status=eq.finished"),
      ]);
      return {
        schema: 1,
        games: finished.length,
        label_sources: [],
        wolf_side_advantage: null,
        models: rows.map((r) => ({
          model: r.model,
          games: Number(r.seat_games),
          win_rate: r.win_rate == null ? null : Number(r.win_rate), // Postgres numeric may arrive as a string
          win_ci: null,
          wolf_win_rate: null,
          village_win_rate: null,
          openskill: null,
          detection_auc: null,
          detection_brier: null,
          invalid_output_rate: null,
          cost_usd_per_game: null,
          lie_rate: {},
        })),
      };
    },
  };
}

/** games.models is jsonb from the runner: a list of model names, or seats mapped to a name or `{model}`. */
function modelNames(m: unknown): string[] | undefined {
  if (typeof m !== "object" || m === null) return undefined;
  const names = Object.values(m)
    .map((v) => (typeof v === "object" && v !== null ? (v as { model?: unknown }).model : v))
    .filter((v): v is string => typeof v === "string");
  return [...new Set(names)].sort();
}
