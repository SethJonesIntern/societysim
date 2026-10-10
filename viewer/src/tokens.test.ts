import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MARKER_APPEARANCE } from "./components/Timeline/markers";

// Read from disk: vitest turns CSS imports (even ?raw) into empty strings.
const dir = new URL(".", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, dir), "utf8");
const tokensCss = read("tokens.css");
const sources = (readdirSync(dir, { recursive: true }) as string[])
  .filter((f) => /\.(tsx?|css)$/.test(f) && !f.endsWith(".test.ts"))
  .map(read);

/** The custom properties each top-level block of tokens.css defines, keyed by its selector. */
const blocks = Object.fromEntries(
  [...tokensCss.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, body]) => [
    selector.trim(),
    Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()])),
  ]),
) as Record<string, Record<string, string>>;
const root = blocks[":root"];
const tint = { day: blocks['[data-tint="day"]'], night: blocks['[data-tint="night"]'] };

// WCAG 2 relative luminance and contrast ratio, for #rrggbb.
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("design tokens", () => {
  it("defines every var() the viewer uses", () => {
    const defined = new Set(Object.values(blocks).flatMap((b) => Object.keys(b)));
    const used = new Set(sources.flatMap((s) => [...s.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])));
    expect(used.size).toBeGreaterThan(20);
    expect([...used].filter((name) => !defined.has(name))).toEqual([]);
  });

  it("both tints define the same tokens", () => {
    expect(Object.keys(tint.night).sort()).toEqual(Object.keys(tint.day).sort());
  });

  it.each(["day", "night"] as const)("%s arrows keep 3:1 graphics contrast on the table and the cloth", (name) => {
    const t = tint[name];
    for (const arrow of [t["--arrow-accuse"], t["--arrow-vote"]])
      for (const ground of [t["--table-bg"], t["--cloth"]]) expect(contrast(arrow, ground)).toBeGreaterThanOrEqual(3);
  });

  it.each(["day", "night"] as const)("%s seat cards keep 4.5:1 text contrast, revealed role cards too", (name) => {
    const t = tint[name];
    expect(contrast(t["--card-ink"], t["--card-bg"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t["--revealed-ink"], t["--revealed-bg"])).toBeGreaterThanOrEqual(4.5);
  });

  it("timeline markers have distinct colors, each 4.5:1 on the surface; bussing no longer reuses the kill red", () => {
    const colors = Object.values(MARKER_APPEARANCE).map((m) => root[m.color.slice(4, -1)]);
    expect(new Set(colors).size).toBe(colors.length);
    for (const c of colors) expect(contrast(c, root["--surface"])).toBeGreaterThanOrEqual(4.5);
    expect(root["--marker-bussing"]).not.toBe(root["--marker-kill"]);
  });
});
