// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGlobalBoard, type BoardLoaders, type DetectorRow, type GlobalBoard, type LiarRow } from "./globalBoard";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const detectors = (n: number): DetectorRow[] => [
  { model: `m${n}`, village_games: n, suspicion_gap: 0.5, votes: 1, wolf_vote_rate: 1, ranked: true },
];
const liars: LiarRow[] = [];
const onlyDetectors = (load: () => Promise<DetectorRow[]>): BoardLoaders => ({ detectors: load, liars: async () => liars });

describe("useGlobalBoard", () => {
  let root: Root;
  let hidden = false;
  beforeEach(() => {
    vi.useFakeTimers();
    hidden = false;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    root = createRoot(document.createElement("div"));
  });
  afterEach(() => {
    act(() => root.unmount());
    vi.useRealTimers();
  });

  function mount(loaders: BoardLoaders) {
    const seen: GlobalBoard[] = [];
    const C = () => {
      seen.push(useGlobalBoard(loaders, 1000));
      return null;
    };
    act(() => root.render(createElement(C)));
    return seen;
  }

  const setHidden = async (h: boolean) => {
    hidden = h;
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
  };

  it("loads at once, then every interval", async () => {
    let calls = 0;
    const seen = mount(onlyDetectors(async () => detectors(++calls)));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(calls).toBe(1);
    expect(seen.at(-1)!.detectors![0].model).toBe("m1");
    await act(() => vi.advanceTimersByTimeAsync(1000));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(calls).toBe(3);
    expect(seen.at(-1)!.detectors![0].model).toBe("m3");
  });

  it("stops while the tab is hidden and reloads when it is shown", async () => {
    let calls = 0;
    mount(onlyDetectors(async () => detectors(++calls)));
    await act(() => vi.advanceTimersByTimeAsync(0));
    await setHidden(true);
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(calls).toBe(1); // the pending tick saw a hidden tab and stopped
    await setHidden(false);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(calls).toBe(2);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(calls).toBe(3);
  });

  it("keeps a tab's last rows on a failed poll and retries", async () => {
    let calls = 0;
    const seen = mount(
      onlyDetectors(async () => {
        if (++calls === 2) throw new Error("HTTP 503");
        return detectors(calls);
      }),
    );
    await act(() => vi.advanceTimersByTimeAsync(0));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(seen.at(-1)).toEqual({ detectors: detectors(1), liars, errors: { detectors: "HTTP 503" } });
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(seen.at(-1)).toEqual({ detectors: detectors(3), liars, errors: {} });
  });

  // #447: global_liars hit a statement timeout (HTTP 500) and took the detectors tab down with it.
  it("a failing liars view never holds back or hides the detectors", async () => {
    let failLiars!: (e: Error) => void;
    const seen = mount({
      detectors: async () => detectors(1),
      liars: () => new Promise<LiarRow[]>((_, reject) => (failLiars = reject)),
    });
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(seen.at(-1)).toEqual({ detectors: detectors(1), liars: null, errors: {} }); // liars still loading
    await act(async () => failLiars(new Error("Neon global_liars: HTTP 500")));
    expect(seen.at(-1)).toEqual({ detectors: detectors(1), liars: null, errors: { liars: "Neon global_liars: HTTP 500" } });
  });

  it("reports a view timeout as timed out", async () => {
    const seen = mount({
      detectors: async () => detectors(1),
      liars: async () => {
        throw new DOMException("signal timed out", "TimeoutError");
      },
    });
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(seen.at(-1)!.errors).toEqual({ liars: "timed out" });
  });
});
