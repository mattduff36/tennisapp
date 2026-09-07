import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readGlobalsCss(): string {
  return readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
}

function desktopBoardBlock(css: string): string {
  const match = css.match(
    /@media \(min-width: 900px\)\s*\{([\s\S]*?)\n\}\n\n@media \(max-width: 899px\)/,
  );
  expect(match).not.toBeNull();
  return match![1]!;
}

function wideBoardBlock(css: string): string {
  const match = css.match(/@media \(min-width: 1280px\)\s*\{([\s\S]*?)\n\}/);
  expect(match).not.toBeNull();
  return match![1]!;
}

describe("desktop pegboard layout CSS", () => {
  it("LAYOUT-DESKTOP-01: waiting sidebar and capped add-player", () => {
    const desktop = desktopBoardBlock(readGlobalsCss());

    expect(desktop).toMatch(
      /\.board-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(15\.5rem,\s*18rem\)\s+minmax\(0,\s*1fr\)/,
    );
    expect(desktop).not.toContain("0.85fr");
    expect(desktop).toMatch(
      /\.player-manager\s*\{[\s\S]*?max-width:\s*22rem/,
    );
    expect(desktop).toMatch(
      /\.app-header\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(16rem,\s*22rem\)/,
    );
  });

  it("LAYOUT-DESKTOP-02: board chrome uses tap-height, ready dock is capped", () => {
    const desktop = desktopBoardBlock(readGlobalsCss());

    expect(desktop).toMatch(
      /\.pegboard-main \.board-dock \.play-primary[\s\S]*?min-height:\s*var\(--tap\)/,
    );
    expect(desktop).toMatch(
      /\.pegboard-main \.player-manager-row input[\s\S]*?min-height:\s*var\(--tap\)/,
    );
    expect(desktop).toMatch(
      /\.pegboard-main \.board-dock > \*\s*\{[\s\S]*?width:\s*min\(28rem,\s*100%\)/,
    );
    expect(desktop).not.toContain("56rem");
  });

  it("LAYOUT-DESKTOP-03: compact status toolbar and court plates get remaining width", () => {
    const css = readGlobalsCss();
    const desktop = desktopBoardBlock(css);
    const wide = wideBoardBlock(css);

    expect(desktop).toMatch(/\.status-bar\s*\{[\s\S]*?display:\s*flex/);
    expect(desktop).toMatch(
      /\.status-bar \.play-danger\s*\{[\s\S]*?margin-left:\s*auto/,
    );
    expect(desktop).toMatch(
      /\.courts-grid\[data-court-count="3"\]\s*\{[\s\S]*?repeat\(3,\s*minmax\(12rem,\s*1fr\)\)/,
    );
    expect(desktop).toMatch(
      /\.court-zone\s*\{[\s\S]*?height:\s*max-content[\s\S]*?overflow:\s*visible/,
    );
    expect(desktop).toMatch(
      /\.courts-column\s*\{[\s\S]*?align-self:\s*start[\s\S]*?grid-template-rows:\s*auto\s+auto/,
    );
    expect(desktop).toMatch(
      /\.pegboard-main \.court-zone \.play-secondary[\s\S]*?min-height:\s*var\(--tap\)/,
    );
    expect(wide).toMatch(
      /\.board-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(16\.5rem,\s*20rem\)\s+minmax\(0,\s*1fr\)/,
    );
    expect(wide).not.toContain("56rem");
  });
});
