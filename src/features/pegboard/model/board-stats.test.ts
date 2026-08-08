import { describe, expect, it } from "vitest";
import type { BoardState } from "./board";
import {
  buildTickerSegments,
  durationMs,
  formatDuration,
  getCourtOccupancyLabel,
  getWaitingSummary,
} from "./board-stats";

const NOW = new Date("2026-08-08T12:00:00.000Z");

describe("board stats", () => {
  it("TIME-02: duration helpers clamp clock skew and format boundaries", () => {
    expect(durationMs("2026-08-08T12:01:00.000Z", NOW)).toBe(0);
    expect(formatDuration("2026-08-08T11:59:15.000Z", NOW)).toBe("45s");
    expect(formatDuration("2026-08-08T11:48:00.000Z", NOW)).toBe("12m");
    expect(formatDuration("2026-08-08T09:00:00.000Z", NOW)).toBe("3h");
    expect(formatDuration("2026-08-08T08:45:00.000Z", NOW)).toBe("3h 15m");
  });

  it("TIME-02: waiting summary, occupancy labels, and ticker segments", () => {
    expect(getCourtOccupancyLabel(0)).toBe("Open");
    expect(getCourtOccupancyLabel(1)).toBe("Incomplete");
    expect(getCourtOccupancyLabel(2)).toBe("Open");
    expect(getCourtOccupancyLabel(4)).toBe("Full");

    const state: BoardState = {
      players: [
        {
          id: "a",
          name: "Ada",
          location: { kind: "waiting" },
          locationEnteredAt: "2026-08-08T11:40:00.000Z",
        },
        {
          id: "b",
          name: "Bea",
          location: { kind: "waiting" },
          locationEnteredAt: "2026-08-08T11:50:00.000Z",
        },
        {
          id: "c",
          name: "Cal",
          location: { kind: "court", courtId: 1 },
          locationEnteredAt: "2026-08-08T11:55:00.000Z",
        },
        {
          id: "d",
          name: "Dee",
          location: { kind: "court", courtId: 1 },
          locationEnteredAt: "2026-08-08T11:56:00.000Z",
        },
      ],
    };

    const waiting = getWaitingSummary(state, NOW);
    expect(waiting.count).toBe(2);
    expect(waiting.longest?.name).toBe("Ada");
    expect(waiting.longestLabel).toBe("Ada 20m");

    const segments = buildTickerSegments(state, NOW);
    expect(segments[0]).toBe("Waiting: 2 · Longest wait: Ada 20m");
    expect(segments).toContain("Court 1: 2/4 Open");
    expect(segments).toContain("Court 2: 0/4 Open");
    expect(segments).toContain("Ada waiting 20m");
    expect(segments).toContain("Cal Court 1 · 5m");
  });
});
