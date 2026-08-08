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

const T0 = new Date("2026-08-08T12:00:00.000Z");
const T1 = new Date("2026-08-08T12:05:00.000Z");
const T0_ISO = "2026-08-08T12:00:00.000Z";
const T1_ISO = "2026-08-08T12:05:00.000Z";

function player(
  partial: Omit<Player, "locationEnteredAt"> & {
    locationEnteredAt?: string;
  },
): Player {
  return {
    locationEnteredAt: T0_ISO,
    ...partial,
  };
}

function withPlayers(players: Player[]): BoardState {
  return { players };
}

describe("board reducer", () => {
  it("STATE-01: default board exposes three empty courts and four waiting players", () => {
    const state = createDefaultBoard(T0);
    expect(getCourtPlayers(state, 1)).toHaveLength(0);
    expect(getCourtPlayers(state, 2)).toHaveLength(0);
    expect(getCourtPlayers(state, 3)).toHaveLength(0);
    expect(getWaitingPlayers(state).map((p) => p.name)).toEqual([
      "Player 1",
      "Player 2",
      "Player 3",
      "Player 4",
    ]);
    expect(state.players.every((p) => p.locationEnteredAt === T0_ISO)).toBe(
      true,
    );
  });

  it("STATE-02 / ASSIGN-01: selected waiting player moves to court and stays uniquely located", () => {
    const seeded = reduceBoard(
      createEmptyBoard(),
      { type: "ADD_PLAYER", name: "Ada" },
      T0,
    ).state;
    const playerId = seeded.players[0]!.id;

    const assigned = reduceBoard(
      seeded,
      { type: "ASSIGN_TO_COURT", playerId, courtId: 2 },
      T1,
    );

    expect(assigned.changed).toBe(true);
    expect(getWaitingPlayers(assigned.state)).toHaveLength(0);
    expect(getCourtPlayers(assigned.state, 2).map((p) => p.name)).toEqual(["Ada"]);
    expect(everyPlayerHasOneLocation(assigned.state)).toBe(true);
    expect(assigned.state.players[0]!.locationEnteredAt).toBe(T1_ISO);
  });

  it("TIME-01: stamps location changes and preserves timestamp on rename / no-ops", () => {
    const seeded = reduceBoard(
      createEmptyBoard(),
      { type: "ADD_PLAYER", name: "Ada" },
      T0,
    ).state;
    const playerId = seeded.players[0]!.id;
    expect(seeded.players[0]!.locationEnteredAt).toBe(T0_ISO);

    const onCourt = reduceBoard(
      seeded,
      { type: "ASSIGN_TO_COURT", playerId, courtId: 1 },
      T1,
    ).state;
    expect(onCourt.players[0]!.locationEnteredAt).toBe(T1_ISO);

    const courtMove = reduceBoard(
      onCourt,
      { type: "ASSIGN_TO_COURT", playerId, courtId: 2 },
      new Date("2026-08-08T12:10:00.000Z"),
    ).state;
    expect(courtMove.players[0]!.locationEnteredAt).toBe(
      "2026-08-08T12:10:00.000Z",
    );

    const returned = reduceBoard(
      courtMove,
      { type: "RETURN_TO_WAITING", playerId },
      new Date("2026-08-08T12:15:00.000Z"),
    ).state;
    expect(returned.players[0]!.locationEnteredAt).toBe(
      "2026-08-08T12:15:00.000Z",
    );

    const renamed = reduceBoard(
      returned,
      { type: "RENAME_PLAYER", playerId, name: "Ada Lovelace" },
      new Date("2026-08-08T12:20:00.000Z"),
    );
    expect(renamed.changed).toBe(true);
    expect(renamed.state.players[0]!.locationEnteredAt).toBe(
      "2026-08-08T12:15:00.000Z",
    );

    const sameCourt = reduceBoard(
      onCourt,
      { type: "ASSIGN_TO_COURT", playerId, courtId: 1 },
      new Date("2026-08-08T13:00:00.000Z"),
    );
    expect(sameCourt.changed).toBe(false);
    expect(sameCourt.state.players[0]!.locationEnteredAt).toBe(T1_ISO);

    const full = withPlayers(
      [1, 2, 3, 4].map((n) =>
        player({
          id: `c-${n}`,
          name: `CourtPlayer ${n}`,
          location: { kind: "court", courtId: 1 },
        }),
      ).concat(
        player({
          id: "waiting-1",
          name: "Extra",
          location: { kind: "waiting" },
          locationEnteredAt: "2026-08-08T11:00:00.000Z",
        }),
      ),
    );
    const rejected = reduceBoard(
      full,
      { type: "ASSIGN_TO_COURT", playerId: "waiting-1", courtId: 1 },
      new Date("2026-08-08T14:00:00.000Z"),
    );
    expect(rejected.changed).toBe(false);
    expect(
      rejected.state.players.find((p) => p.id === "waiting-1")!.locationEnteredAt,
    ).toBe("2026-08-08T11:00:00.000Z");
  });

  it("ASSIGN-02: fifth assignment is rejected without mutation", () => {
    const players: Player[] = [1, 2, 3, 4].map((n) =>
      player({
        id: `c-${n}`,
        name: `CourtPlayer ${n}`,
        location: { kind: "court", courtId: 1 as const },
      }),
    );
    players.push(
      player({
        id: "waiting-1",
        name: "Extra",
        location: { kind: "waiting" },
      }),
    );

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
      player({
        id: "solo",
        name: "Solo",
        location: { kind: "court", courtId: 3 },
      }),
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

  it("ASSIGN allows moving a player from one court to another", () => {
    const seeded = withPlayers([
      player({
        id: "p1",
        name: "Ada",
        location: { kind: "court", courtId: 1 },
      }),
    ]);
    const moved = reduceBoard(seeded, {
      type: "ASSIGN_TO_COURT",
      playerId: "p1",
      courtId: 2,
    });
    expect(moved.changed).toBe(true);
    expect(getCourtPlayers(moved.state, 1)).toHaveLength(0);
    expect(getCourtPlayers(moved.state, 2).map((p) => p.name)).toEqual(["Ada"]);
  });

  it("RETURN-01: on-court player returns to waiting", () => {
    const seeded = withPlayers([
      player({
        id: "p1",
        name: "Bea",
        location: { kind: "court", courtId: 1 },
      }),
    ]);
    const result = reduceBoard(seeded, {
      type: "RETURN_TO_WAITING",
      playerId: "p1",
    });

    expect(result.changed).toBe(true);
    expect(getWaitingPlayers(result.state).map((p) => p.name)).toEqual(["Bea"]);
    expect(getCourtPlayers(result.state, 1)).toHaveLength(0);
  });

  it("STATE-02: REPLACE_BOARD rejects duplicate ids, over-capacity, and missing timestamps", () => {
    const current = createEmptyBoard();
    const duplicates = withPlayers([
      player({
        id: "dup",
        name: "One",
        location: { kind: "waiting" },
      }),
      player({
        id: "dup",
        name: "Two",
        location: { kind: "court", courtId: 1 },
      }),
    ]);

    const rejectedDuplicates = reduceBoard(current, {
      type: "REPLACE_BOARD",
      board: duplicates,
    });
    expect(rejectedDuplicates.changed).toBe(false);
    expect(rejectedDuplicates.state).toBe(current);

    const overCapacity = withPlayers(
      [1, 2, 3, 4, 5].map((n) =>
        player({
          id: `p-${n}`,
          name: `Player ${n}`,
          location: { kind: "court" as const, courtId: 1 as const },
        }),
      ),
    );
    const rejectedCapacity = reduceBoard(current, {
      type: "REPLACE_BOARD",
      board: overCapacity,
    });
    expect(rejectedCapacity.changed).toBe(false);

    const missingTimestamp = {
      players: [
        {
          id: "a",
          name: "Ada",
          location: { kind: "waiting" as const },
          locationEnteredAt: "not-iso",
        },
      ],
    };
    const rejectedTimestamp = reduceBoard(current, {
      type: "REPLACE_BOARD",
      board: missingTimestamp,
    });
    expect(rejectedTimestamp.changed).toBe(false);

    const valid = withPlayers([
      player({
        id: "a",
        name: "Ada",
        location: { kind: "waiting" },
      }),
    ]);
    const accepted = reduceBoard(current, {
      type: "REPLACE_BOARD",
      board: valid,
    });
    expect(accepted.changed).toBe(true);
    expect(everyPlayerHasOneLocation(accepted.state)).toBe(true);
  });
});
