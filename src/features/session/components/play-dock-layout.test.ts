import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readGlobalsCss(): string {
  return readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
}

describe("play dock layout CSS", () => {
  it("LAYOUT-PLAY-01: phone shell stacks nav, main, ticker, then dock", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.play-shell\s*\{[\s\S]*?grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+auto\s+auto/,
    );
    expect(css).toMatch(/\.play-dock:empty\s*\{[\s\S]*?display:\s*none/);
    expect(css).toMatch(
      /\.play-shell\[data-keyboard="open"\] \.play-ticker\s*\{[\s\S]*?display:\s*none/,
    );
    expect(css).toMatch(
      /\.play-shell\[data-dock-size="compact"\] \.play-dock \.play-primary[\s\S]*?min-height:\s*var\(--play-dock-button-min\)/,
    );
  });
});
