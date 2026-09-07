import { describe, expect, it } from "vitest";
import { buildSessionTickerSegments } from "./session-stats";
import type { SessionView } from "./session-view";

const view: SessionView = {
  settings: { courtCount: 2, gameMode: "singles" },
  courts: [
    {
      id: "c1",
      name: "Court 1",
      sortOrder: 1,
      occupied: true,
      startedAt: "2026-09-06T12:00:00.000Z",
      durationLabel: "12m",
      players: [
        { id: "a", name: "Ada" },
        { id: "b", name: "Bea" },
      ],
    },
    {
      id: "c2",
      name: "Court 2",
      sortOrder: 2,
      occupied: false,
      startedAt: null,
      durationLabel: null,
      players: [],
    },
  ],
  waiting: [
    {
      id: "c",
      name: "Cara",
      joinedAt: "2026-09-06T11:50:00.000Z",
      waitLabel: "22m",
    },
  ],
  requiredPlayers: 2,
  waitingCount: 1,
  freeCourtCount: 1,
  playersNeeded: 1,
  canStart: false,
  startBlockedReason: "need_players",
  me: null,
  playerMissing: false,
};

describe("session ticker", () => {
  it("lists waiting, court play, and free courts", () => {
    expect(buildSessionTickerSegments(view)).toEqual([
      "Waiting: 1 · Longest wait: Cara 22m",
      "Court 1: Ada, Bea · 12m",
      "Court 2: free",
      "Cara waiting 22m",
    ]);
  });
});
