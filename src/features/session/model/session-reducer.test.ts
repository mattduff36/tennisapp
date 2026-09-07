import { describe, expect, it } from "vitest";
import { reduceSession } from "./session-reducer";
import { createDefaultSession, type SessionState } from "./session";
import {
  getCourtPlayers,
  getFreeCourts,
  getStartAvailability,
  getWaitingPlayers,
  pickRandomItems,
} from "./session-selectors";

const T0 = new Date("2026-09-06T12:00:00.000Z");

function joinMany(names: string[]): SessionState {
  let state = createDefaultSession();
  names.forEach((name, index) => {
    const token = `p-${index + 1}`;
    const result = reduceSession(
      state,
      { type: "JOIN", token, name },
      T0,
      Math.random,
      () => token,
    );
    expect(result.error).toBeNull();
    state = result.state;
  });
  return state;
}

describe("session reducer", () => {
  it("SESSION-JOIN-01 unique name / reject duplicate name_key", () => {
    const first = reduceSession(
      createDefaultSession(),
      { type: "JOIN", token: "token-a", name: "  Ada  " },
      T0,
      Math.random,
      () => "a",
    );
    expect(first.changed).toBe(true);
    expect(first.state.players[0]).toMatchObject({
      id: "a",
      token: "token-a",
      name: "Ada",
      nameKey: "ada",
      claimed: true,
      status: "waiting",
    });

    const taken = reduceSession(
      first.state,
      { type: "JOIN", token: "token-b", name: "ada" },
      T0,
    );
    expect(taken.changed).toBe(false);
    expect(taken.error).toBe("name_taken");
    expect(taken.notice).toMatch(/already in the pool/i);
    expect(taken.state.players).toHaveLength(1);
  });

  it("SESSION-JOIN-02 remembered token returns existing player", () => {
    const joined = reduceSession(
      createDefaultSession(),
      { type: "JOIN", token: "token-a", name: "Ada" },
      T0,
      Math.random,
      () => "a",
    ).state;

    const again = reduceSession(
      joined,
      { type: "JOIN", token: "token-a", name: "Other" },
      T0,
    );
    expect(again.changed).toBe(false);
    expect(again.error).toBeNull();
    expect(again.state.players).toHaveLength(1);
    expect(again.state.players[0]!.name).toBe("Ada");
  });

  it("SESSION-JOIN-03 public player id is not a join token", () => {
    const joined = reduceSession(
      createDefaultSession(),
      { type: "JOIN", token: "secret-token", name: "Ada" },
      T0,
      Math.random,
      () => "public-id",
    ).state;
    expect(joined.players[0]).toMatchObject({
      id: "public-id",
      token: "secret-token",
    });

    const steal = reduceSession(
      joined,
      { type: "JOIN", token: "public-id", name: "Bea" },
      T0,
      Math.random,
      () => "other-id",
    );
    expect(steal.changed).toBe(true);
    expect(steal.state.players).toHaveLength(2);
    expect(steal.state.players.find((player) => player.id === "public-id")?.name).toBe(
      "Ada",
    );
    expect(steal.state.players.find((player) => player.token === "public-id")?.name).toBe(
      "Bea",
    );
  });

  it("SESSION-CLAIM-01 claim unclaimed helper name", () => {
    const helper = reduceSession(
      createDefaultSession(),
      { type: "JOIN", token: "helper-token", name: "Ada", claimed: false },
      T0,
      Math.random,
      () => "ada-id",
    );
    expect(helper.state.players[0]).toMatchObject({
      id: "ada-id",
      claimed: false,
      joinedAt: T0.toISOString(),
    });

    const blocked = reduceSession(
      helper.state,
      { type: "JOIN", token: "phone-token", name: "ada" },
      T0,
    );
    expect(blocked.error).toBe("name_unclaimed");

    const claimed = reduceSession(
      helper.state,
      { type: "CLAIM", token: "phone-token", name: "Ada" },
      T0,
    );
    expect(claimed.changed).toBe(true);
    expect(claimed.state.players).toHaveLength(1);
    expect(claimed.state.players[0]).toMatchObject({
      id: "ada-id",
      token: "phone-token",
      claimed: true,
      joinedAt: T0.toISOString(),
    });
  });

  it("SESSION-CLAIM-02 claimed name stays taken", () => {
    const phone = reduceSession(
      createDefaultSession(),
      { type: "JOIN", token: "phone-a", name: "Ada" },
      T0,
      Math.random,
      () => "ada-id",
    );
    const taken = reduceSession(
      phone.state,
      { type: "JOIN", token: "phone-b", name: "ada" },
      T0,
    );
    expect(taken.error).toBe("name_taken");

    const steal = reduceSession(
      phone.state,
      { type: "CLAIM", token: "phone-b", name: "Ada" },
      T0,
    );
    expect(steal.changed).toBe(false);
    expect(steal.error).toBe("name_taken");
    expect(steal.state.players[0]?.token).toBe("phone-a");
  });

  it("SESSION-CLAIM-03 claim while on court keeps assignment", () => {
    const helper = reduceSession(
      joinMany(["Bea", "Cara", "Dee"]),
      { type: "JOIN", token: "helper-token", name: "Ada", claimed: false },
      T0,
      Math.random,
      () => "p-ada",
    ).state;
    const started = reduceSession(
      helper,
      { type: "START_NEXT_MATCH" },
      T0,
    );
    expect(started.state.players.find((player) => player.id === "p-ada")?.status).toBe(
      "on_court",
    );

    const claimed = reduceSession(
      started.state,
      { type: "CLAIM", token: "phone-token", name: "Ada" },
      T0,
    );
    const ada = claimed.state.players.find((player) => player.id === "p-ada");
    expect(claimed.changed).toBe(true);
    expect(ada).toMatchObject({
      token: "phone-token",
      claimed: true,
      status: "on_court",
      courtId: started.courtId,
    });
  });

  it("SESSION-READY-RULE-01 phone longest wait includes requester plus earliest others", () => {
    let state = createDefaultSession();
    ["Ada", "Bea", "Cara", "Dee", "Eve"].forEach((name, index) => {
      state = reduceSession(
        state,
        { type: "JOIN", token: `p-${index + 1}`, name },
        new Date(T0.getTime() + index * 60_000),
        Math.random,
        () => `p-${index + 1}`,
      ).state;
    });
    const result = reduceSession(
      state,
      { type: "START_MATCH", playerId: "p-5" },
      T0,
      () => 0.99,
    );
    expect(result.selectedPlayerIds?.sort()).toEqual(["p-1", "p-2", "p-3", "p-5"]);
  });

  it("SESSION-READY-RULE-02 tablet random uses pickRandomItems", () => {
    let state = createDefaultSession();
    state = {
      ...state,
      settings: { ...state.settings, readyRule: "random" },
    };
    ["Ada", "Bea", "Cara", "Dee", "Eve"].forEach((name, index) => {
      state = reduceSession(
        state,
        { type: "JOIN", token: `p-${index + 1}`, name },
        new Date(T0.getTime() + index * 60_000),
        Math.random,
        () => `p-${index + 1}`,
      ).state;
    });
    const random = () => 0.99;
    const expected = pickRandomItems(getWaitingPlayers(state), 4, random).map(
      (player) => player.id,
    );
    const result = reduceSession(state, { type: "START_NEXT_MATCH" }, T0, random);
    expect(result.selectedPlayerIds).toEqual(expected);
  });

  it("SESSION-READY-01 requester included; random others; one court", () => {
    const state = joinMany(["Ada", "Bea", "Cara", "Dee", "Eve"]);
    const result = reduceSession(
      state,
      { type: "START_MATCH", playerId: "p-1" },
      T0,
      () => 0,
    );

    expect(result.changed).toBe(true);
    expect(result.courtId).toBe("default-court-1");
    expect(result.selectedPlayerIds).toContain("p-1");
    expect(result.selectedPlayerIds).toHaveLength(4);

    const courtOne = getCourtPlayers(result.state, "default-court-1");
    expect(courtOne.map((item) => item.id)).toEqual(
      expect.arrayContaining(["p-1"]),
    );
    expect(courtOne).toHaveLength(4);
    expect(getFreeCourts(result.state).map((court) => court.id)).toEqual([
      "default-court-2",
      "default-court-3",
    ]);
    expect(getWaitingPlayers(result.state)).toHaveLength(1);
    expect(
      result.state.courts.find((court) => court.id === "default-court-1")?.startedAt,
    ).toBe(T0.toISOString());
    expect(
      result.state.courts
        .filter((court) => court.id !== "default-court-1")
        .every((court) => court.startedAt === null),
    ).toBe(true);
  });

  it("SESSION-START-01 token ready includes requester and sets startedAt", () => {
    const state = joinMany(["Ada", "Bea", "Cara", "Dee"]);
    const result = reduceSession(
      state,
      { type: "START_MATCH", playerId: "p-1" },
      T0,
      () => 0,
    );
    expect(result.changed).toBe(true);
    expect(result.selectedPlayerIds).toContain("p-1");
    expect(result.selectedPlayerIds).toHaveLength(4);
    expect(
      result.state.courts.find((court) => court.id === result.courtId)?.startedAt,
    ).toBe(T0.toISOString());
  });

  it("SESSION-START-02 no-token ready picks longest waiters and sets startedAt", () => {
    let state = createDefaultSession();
    ["Ada", "Bea", "Cara", "Dee", "Eve"].forEach((name, index) => {
      const joined = reduceSession(
        state,
        { type: "JOIN", token: `p-${index + 1}`, name },
        new Date(T0.getTime() + index * 60_000),
        Math.random,
        () => `p-${index + 1}`,
      );
      expect(joined.error).toBeNull();
      state = joined.state;
    });

    const result = reduceSession(state, { type: "START_NEXT_MATCH" }, T0);
    expect(result.changed).toBe(true);
    expect(result.selectedPlayerIds?.sort()).toEqual(["p-1", "p-2", "p-3", "p-4"]);
    expect(getWaitingPlayers(result.state).map((player) => player.id)).toEqual(["p-5"]);
    expect(
      result.state.courts.find((court) => court.id === "default-court-1")?.startedAt,
    ).toBe(T0.toISOString());
  });

  it("SESSION-START-03 helper ready blocked if too few waiters or no free court", () => {
    const few = joinMany(["Ada", "Bea"]);
    const needMore = reduceSession(few, { type: "START_NEXT_MATCH" }, T0);
    expect(needMore.changed).toBe(false);
    expect(needMore.error).toBe("need_players");

    const enough = joinMany(["Ada", "Bea", "Cara", "Dee"]);
    const oneCourt = {
      ...enough,
      courts: enough.courts.slice(0, 1),
      settings: { ...enough.settings, courtCount: 1 },
    };
    const first = reduceSession(oneCourt, { type: "START_NEXT_MATCH" }, T0);
    expect(first.changed).toBe(true);

    const extra = reduceSession(
      first.state,
      { type: "JOIN", token: "p-5", name: "Eve" },
      T0,
      Math.random,
      () => "p-5",
    ).state;
    const extra2 = reduceSession(
      extra,
      { type: "JOIN", token: "p-6", name: "Fay" },
      T0,
      Math.random,
      () => "p-6",
    ).state;
    const extra3 = reduceSession(
      extra2,
      { type: "JOIN", token: "p-7", name: "Gus" },
      T0,
      Math.random,
      () => "p-7",
    ).state;
    const extra4 = reduceSession(
      extra3,
      { type: "JOIN", token: "p-8", name: "Hal" },
      T0,
      Math.random,
      () => "p-8",
    ).state;

    const noCourt = reduceSession(extra4, { type: "START_NEXT_MATCH" }, T0);
    expect(noCourt.changed).toBe(false);
    expect(noCourt.error).toBe("no_free_court");
  });

  it("SESSION-DURATION-01 startedAt cleared on end, clear, and reset", () => {
    const started = reduceSession(
      joinMany(["Ada", "Bea", "Cara", "Dee"]),
      { type: "START_MATCH", playerId: "p-1" },
      T0,
      () => 0,
    );
    expect(
      started.state.courts.find((court) => court.id === "default-court-1")?.startedAt,
    ).toBe(T0.toISOString());

    const ended = reduceSession(started.state, { type: "END_MATCH", playerId: "p-1" }, T0);
    expect(
      ended.state.courts.find((court) => court.id === "default-court-1")?.startedAt,
    ).toBeNull();

    const startedAgain = reduceSession(
      ended.state,
      { type: "START_MATCH", playerId: "p-1" },
      T0,
      () => 0,
    );
    const cleared = reduceSession(
      startedAgain.state,
      { type: "CLEAR_COURT", courtId: "default-court-1" },
      T0,
    );
    expect(
      cleared.state.courts.find((court) => court.id === "default-court-1")?.startedAt,
    ).toBeNull();

    const occupied = reduceSession(
      cleared.state,
      { type: "START_MATCH", playerId: "p-1" },
      T0,
      () => 0,
    );
    const reset = reduceSession(occupied.state, { type: "RESET_SESSION" }, T0);
    expect(reset.state.courts.every((court) => court.startedAt === null)).toBe(true);
    expect(reset.state.players).toHaveLength(0);
  });

  it("does not remove an on-court player and leave a short court", () => {
    const started = reduceSession(
      joinMany(["Ada", "Bea", "Cara", "Dee"]),
      { type: "START_MATCH", playerId: "p-1" },
      T0,
      () => 0,
    );
    const removed = reduceSession(
      started.state,
      { type: "REMOVE_PLAYER", playerId: "p-1" },
      T0,
    );
    expect(removed.changed).toBe(false);
    expect(removed.error).toBe("not_waiting");
    expect(removed.notice).toMatch(/clear the court/i);
    expect(getCourtPlayers(removed.state, "default-court-1")).toHaveLength(4);
  });

  it("SESSION-READY-02 blocked if too few waiters or no free court", () => {
    const few = joinMany(["Ada", "Bea"]);
    const needMore = reduceSession(few, { type: "START_MATCH", playerId: "p-1" }, T0);
    expect(needMore.changed).toBe(false);
    expect(needMore.error).toBe("need_players");

    const enough = joinMany(["Ada", "Bea", "Cara", "Dee"]);
    const oneCourt = {
      ...enough,
      courts: enough.courts.slice(0, 1),
      settings: { ...enough.settings, courtCount: 1 },
    };
    const first = reduceSession(oneCourt, { type: "START_MATCH", playerId: "p-1" }, T0, () => 0);
    expect(first.changed).toBe(true);

    const extra = reduceSession(
      first.state,
      { type: "JOIN", token: "p-5", name: "Eve" },
      T0,
      Math.random,
      () => "p-5",
    ).state;
    const extra2 = reduceSession(
      extra,
      { type: "JOIN", token: "p-6", name: "Fay" },
      T0,
      Math.random,
      () => "p-6",
    ).state;
    const extra3 = reduceSession(
      extra2,
      { type: "JOIN", token: "p-7", name: "Gus" },
      T0,
      Math.random,
      () => "p-7",
    ).state;
    const extra4 = reduceSession(
      extra3,
      { type: "JOIN", token: "p-8", name: "Hal" },
      T0,
      Math.random,
      () => "p-8",
    ).state;

    const noCourt = reduceSession(extra4, { type: "START_MATCH", playerId: "p-5" }, T0);
    expect(noCourt.changed).toBe(false);
    expect(noCourt.error).toBe("no_free_court");
  });

  it("SESSION-READY-03 second start cannot reuse players or court", () => {
    const state = joinMany(["Ada", "Bea", "Cara", "Dee", "Eve", "Fay", "Gus", "Hal"]);
    const first = reduceSession(state, { type: "START_MATCH", playerId: "p-1" }, T0, () => 0);
    expect(first.changed).toBe(true);
    const takenIds = new Set(first.selectedPlayerIds);

    const reuseRequester = reduceSession(
      first.state,
      { type: "START_MATCH", playerId: "p-1" },
      T0,
    );
    expect(reuseRequester.error).toBe("not_waiting");

    const leftover = getWaitingPlayers(first.state)[0];
    expect(leftover).toBeDefined();
    const second = reduceSession(
      first.state,
      { type: "START_MATCH", playerId: leftover!.id },
      T0,
      () => 0,
    );
    expect(second.changed).toBe(true);
    expect(second.courtId).toBe("default-court-2");
    expect(second.selectedPlayerIds?.some((id) => takenIds.has(id))).toBe(false);
    expect(getCourtPlayers(second.state, "default-court-1")).toHaveLength(4);
    expect(getCourtPlayers(second.state, "default-court-2")).toHaveLength(4);
  });

  it("SESSION-DONE-01 whole court returns to waiting", () => {
    const started = reduceSession(
      joinMany(["Ada", "Bea", "Cara", "Dee"]),
      { type: "START_MATCH", playerId: "p-2" },
      T0,
      () => 0,
    );
    expect(getCourtPlayers(started.state, "default-court-1")).toHaveLength(4);

    const done = reduceSession(started.state, { type: "END_MATCH", playerId: "p-3" }, T0);
    expect(done.changed).toBe(true);
    expect(getWaitingPlayers(done.state)).toHaveLength(4);
    expect(getCourtPlayers(done.state, "default-court-1")).toHaveLength(0);
    expect(done.state.players.every((item) => item.status === "waiting")).toBe(true);
  });

  it("SESSION-SETTINGS-01 singles=2 / doubles=4; cannot delete an occupied court", () => {
    const doubles = createDefaultSession();
    expect(getStartAvailability(doubles).required).toBe(4);

    const singles = reduceSession(doubles, {
      type: "UPDATE_SETTINGS",
      gameMode: "singles",
    });
    expect(singles.state.settings.gameMode).toBe("singles");
    expect(getStartAvailability(singles.state).required).toBe(2);

    const pair = reduceSession(
      joinMany(["Ada", "Bea"]),
      { type: "UPDATE_SETTINGS", gameMode: "singles" },
      T0,
    ).state;
    const started = reduceSession(pair, { type: "START_MATCH", playerId: "p-1" }, T0, () => 0);
    expect(started.changed).toBe(true);
    expect(getCourtPlayers(started.state, "default-court-1")).toHaveLength(2);

    const invalidCount = reduceSession(started.state, {
      type: "UPDATE_SETTINGS",
      courtCount: 0,
    });
    expect(invalidCount.error).toBe("invalid_settings");

    const keepOccupied = reduceSession(started.state, {
      type: "UPDATE_SETTINGS",
      courtCount: 1,
    });
    expect(keepOccupied.changed).toBe(true);
    expect(keepOccupied.state.courts.map((court) => court.id)).toEqual([
      "default-court-1",
    ]);

    const occupiedLast: SessionState = {
      ...started.state,
      courts: [
        { ...started.state.courts[1]!, sortOrder: 1 },
        { ...started.state.courts[2]!, sortOrder: 2 },
        { ...started.state.courts[0]!, sortOrder: 3 },
      ],
    };
    const blocked = reduceSession(occupiedLast, {
      type: "UPDATE_SETTINGS",
      courtCount: 2,
    });
    expect(blocked.error).toBe("occupied_court");
    expect(blocked.notice).toMatch(/still has players/i);

    const modeBlocked = reduceSession(started.state, {
      type: "UPDATE_SETTINGS",
      gameMode: "doubles",
    });
    expect(modeBlocked.changed).toBe(false);
    expect(modeBlocked.error).toBe("occupied_court");
    expect(modeBlocked.notice).toMatch(/singles or doubles/i);
    expect(getCourtPlayers(modeBlocked.state, "default-court-1")).toHaveLength(2);
  });
});
