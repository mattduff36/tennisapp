import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BoardState } from "../model/board";
import { StatsTicker } from "./stats-ticker";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const board: BoardState = {
  players: [
    {
      id: "a",
      name: "Ada",
      location: { kind: "waiting" },
      locationEnteredAt: "2026-08-08T11:40:00.000Z",
    },
    {
      id: "c",
      name: "Cal",
      location: { kind: "court", courtId: 1 },
      locationEnteredAt: "2026-08-08T11:55:00.000Z",
    },
  ],
};

describe("stats ticker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("TICKER-01: decorative duplicate track with required segments and refresh", () => {
    render(<StatsTicker board={board} />);

    const root = document.querySelector(".stats-ticker");
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root?.querySelectorAll("button, a, input").length).toBe(0);

    const tracks = document.querySelectorAll(".stats-ticker-track");
    expect(tracks).toHaveLength(2);
    expect(document.querySelectorAll(".stats-ticker-ball").length).toBeGreaterThan(
      0,
    );

    expect(screen.getAllByText(/Waiting: 1 · Longest wait: Ada/i).length).toBe(
      2,
    );
    expect(screen.getAllByText(/Court 1: 1\/4 Incomplete/i).length).toBe(2);
    expect(screen.getAllByText(/Ada waiting/i).length).toBe(2);
    expect(screen.getAllByText(/Cal Court 1/i).length).toBe(2);

    const before = screen.getAllByText(/Ada waiting/i)[0]!.textContent;
    act(() => {
      vi.setSystemTime(new Date("2026-08-08T12:30:00.000Z"));
      vi.advanceTimersByTime(30_000);
    });
    const after = screen.getAllByText(/Ada waiting/i)[0]!.textContent;
    expect(after).not.toBe(before);
  });

  it("TICKER-01 / SPACE-01: CSS hides ticker below 900px and uses spacing tokens", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/app/globals.css"),
      "utf8",
    );

    expect(css).toContain(".stats-ticker {");
    expect(css).toContain("display: none;");
    expect(css).toContain("@media (min-width: 900px)");
    expect(css).toContain("@media (max-width: 899px)");
    expect(css).toContain("grid-template-rows: auto auto minmax(0, 1fr) auto;");
    expect(css).toContain(".stats-ticker-rail {");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toMatch(/\.stats-ticker-rail\s*\{[\s\S]*?animation:\s*none/);

    expect(css).toMatch(/\.pegboard-shell\s*\{[\s\S]*?gap:\s*var\(--space-4\)/);
    expect(css).toMatch(/\.board-grid\s*\{[\s\S]*?gap:\s*var\(--space-4\)/);
    expect(css).toMatch(/\.zone\s*\{[\s\S]*?padding:\s*var\(--space-4\)/);
    expect(css).toMatch(/\.player-list\s*\{[\s\S]*?gap:\s*var\(--space-3\)/);
    expect(css).toMatch(/\.player-tile\s*\{[\s\S]*?padding:\s*var\(--space-3\)/);
  });
});
