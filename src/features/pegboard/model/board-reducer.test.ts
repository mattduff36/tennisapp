import { describe, expect, it } from "vitest";
import {
  createDefaultBoard,
  createEmptyBoard,
  type BoardState,
  type Player,
} from "./board";
import { reduceBoard } from "./board-reducer";
import {
  everyPlayerHasOneLocation,
  getCourtPlayers,
  getWaitingPlayers,
  isCourtIncomplete,
} from "./board-selectors";

function withPlayers(players: Player[]): BoardState {
  return { players };
}

describe("board reducer", () => {
  it("STATE-01: default board exposes three empty courts and four waiting players", () => {
    const state = createDefaultBoard();
    expect(getCourtPlayers(state, 1)).toHaveLength(0);
    expect(getCourtPlayers(state, 2)).toHaveLength(0);
    expect(getCourtPlayers(state, 3)).toHaveLength(0);
    expect(getWaitingPlayers(state).map((player) => player.name)).toEqual([
      "Player 1",
      "Player 2",
      "Player 3",
      "Player 4",
    ]);
  });

  it("STATE-02 / ASSIGN-01: selected waiting player moves to court and stays uniquely located", () => {
    const seeded = reduceBoard(createEmptyBoard(), {
      type: "ADD_PLAYER",
      name: "Ada",
    }).state;
    const playerId = seeded.players[0]!.id;

    const assigned = reduceBoard(seeded, {
      type: "ASSIGN_TO_COURT",
      playerId,
      courtId: 2,
    });

    expect(assigned.changed).toBe(true);
    expect(getWaitingPlayers(assigned.state)).toHaveLength(0);
    expect(getCourtPlayers(assigned.state, 2).map((p) => p.name)).toEqual(["Ada"]);
    expect(everyPlayerHasOneLocation(assigned.state)).toBe(true);
  });

  it("ASSIGN-02: fifth assignment is rejected without mutation", () => {
    const players: Player[] = [1, 2, 3, 4].map((n) => ({
      id: `c-${n}`,
      name: `CourtPlayer ${n}`,
      location: { kind: "court", courtId: 1 as const },
    }));
    players.push({
      id: "waiting-1",
      name: "Extra",
      location: { kind: "waiting" },
    });

    const state = withPlayers(players);
    const result = reduceBoard(state, {
      type: "ASSIGN_TO_COURT",
      playerId: "waiting-1",
      courtId: 1,
    });

    expect(result.changed).toBe(false);
    expect(result.state).toBe(state);
    expect(result.notice).toMatch(/full/i);
    expect(getCourtPlayers(result.state, 1)).toHaveLength(4);
  });

  it("COURT-01: only one occupant produces incomplete", () => {
    const one = withPlayers([
      {
        id: "solo",
        name: "Solo",
        location: { kind: "court", courtId: 3 },
      },
    ]);
    expect(isCourtIncomplete(one, 3)).toBe(true);
    expect(isCourtIncomplete(createEmptyBoard(), 3)).toBe(false);

    const two = reduceBoard(one, {
      type: "ADD_PLAYER",
      name: "Partner",
    }).state;
    const partnerId = two.players.find((p) => p.name === "Partner")!.id;
    const filled = reduceBoard(two, {
      type: "ASSIGN_TO_COURT",
      playerId: partnerId,
      courtId: 3,
    }).state;
    expect(isCourtIncomplete(filled, 3)).toBe(false);
  });

  it("RETURN-01: on-court player returns to waiting", () => {
    const seeded = withPlayers([
      {
        id: "p1",
        name: "Bea",
        location: { kind: "court", courtId: 1 },
      },
    ]);
    const result = reduceBoard(seeded, {
      type: "RETURN_TO_WAITING",
      playerId: "p1",
    });

    expect(result.changed).toBe(true);
    expect(getWaitingPlayers(result.state).map((p) => p.name)).toEqual(["Bea"]);
    expect(getCourtPlayers(result.state, 1)).toHaveLength(0);
  });

  it("STATE-02: REPLACE_BOARD rejects duplicate ids and over-capacity courts", () => {
    const current = createEmptyBoard();
    const duplicates = withPlayers([
      {
        id: "dup",
        name: "One",
        location: { kind: "waiting" },
      },
      {
        id: "dup",
        name: "Two",
        location: { kind: "court", courtId: 1 },
      },
    ]);

    const rejectedDuplicates = reduceBoard(current, {
      type: "REPLACE_BOARD",
      board: duplicates,
    });
    expect(rejectedDuplicates.changed).toBe(false);
    expect(rejectedDuplicates.state).toBe(current);

    const overCapacity = withPlayers(
      [1, 2, 3, 4, 5].map((n) => ({
        id: `p-${n}`,
        name: `Player ${n}`,
        location: { kind: "court" as const, courtId: 1 as const },
      })),
    );
    const rejectedCapacity = reduceBoard(current, {
      type: "REPLACE_BOARD",
      board: overCapacity,
    });
    expect(rejectedCapacity.changed).toBe(false);

    const valid = withPlayers([
      {
        id: "a",
        name: "Ada",
        location: { kind: "waiting" },
      },
    ]);
    const accepted = reduceBoard(current, {
      type: "REPLACE_BOARD",
      board: valid,
    });
    expect(accepted.changed).toBe(true);
    expect(everyPlayerHasOneLocation(accepted.state)).toBe(true);
  });
});
