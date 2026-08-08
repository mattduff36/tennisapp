import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readGlobalsCss(): string {
  return readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
}

function mobileBlock(css: string): string {
  const match = css.match(
    /@media \(max-width: 899px\)\s*\{([\s\S]*?)\n\}\n\n@media \(prefers-reduced-motion/,
  );
  expect(match).not.toBeNull();
  return match![1]!;
}

describe("mobile pegboard layout CSS", () => {
  it("LAYOUT-MOBILE-01: content-height board and auto court rows", () => {
    const mobile = mobileBlock(readGlobalsCss());

    expect(mobile).toMatch(
      /\.board-grid\s*\{[\s\S]*?grid-template-rows:\s*auto\s+auto/,
    );
    expect(mobile).toMatch(
      /\.courts-grid\s*\{[\s\S]*?grid-auto-rows:\s*auto/,
    );
    expect(mobile).not.toContain("minmax(160px, 1fr)");
    expect(mobile).not.toContain("minmax(180px, 0.4fr)");
  });

  it("LAYOUT-MOBILE-02: shell scrollport, non-clipping stage, waiting max-height", () => {
    const css = readGlobalsCss();
    const mobile = mobileBlock(css);

    expect(css).toMatch(/html,\s*body\s*\{[\s\S]*?overflow:\s*hidden/);
    const shellMatch = mobile.match(/\.pegboard-shell\s*\{([^}]+)\}/);
    expect(shellMatch).not.toBeNull();
    const shellBody = shellMatch![1]!;
    expect(shellBody).toMatch(/height:\s*100vh/);
    expect(shellBody).toMatch(/height:\s*100dvh/);
    expect(shellBody).toMatch(/overflow:\s*auto/);
    expect(shellBody).toMatch(/grid-template-rows:\s*auto\s+auto\s+auto/);
    expect(shellBody).not.toMatch(/height:\s*auto/);
    expect(mobile).toMatch(
      /\.board-stage\s*\{[\s\S]*?height:\s*auto[\s\S]*?overflow:\s*visible/,
    );
    expect(mobile).toMatch(
      /\.waiting-zone\s*\{[\s\S]*?max-height:\s*min\(40vh,\s*20rem\)[\s\S]*?overflow:\s*auto/,
    );
    expect(mobile).toMatch(
      /\.court-zone\s*\{[\s\S]*?height:\s*auto[\s\S]*?overflow:\s*visible/,
    );
  });

  it("LAYOUT-MOBILE-03: player-name ellipsis, hidden hints, large-text compact spacing", () => {
    const mobile = mobileBlock(readGlobalsCss());

    expect(mobile).toMatch(/\.player-hint\s*\{[\s\S]*?display:\s*none/);
    expect(mobile).toMatch(
      /\.player-name\s*\{[\s\S]*?text-overflow:\s*ellipsis[\s\S]*?white-space:\s*nowrap/,
    );
    expect(mobile).toMatch(/\.on-court-heading p\s*\{[\s\S]*?display:\s*none/);
    expect(mobile).toContain('html[data-text-size="large"]');
    expect(mobile).toContain('html[data-text-size="largest"]');
    expect(mobile).toMatch(
      /html\[data-text-size="largest"\] \.zone[\s\S]*?padding:\s*var\(--space-2\)/,
    );
  });
});
