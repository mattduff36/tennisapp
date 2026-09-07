import { describe, expect, it } from "vitest";
import { reduceSession } from "./session-reducer";
import { createDefaultSession } from "./session";
import { toSessionView } from "./session-view";

const T0 = new Date("2026-09-06T12:00:00.000Z");
const LATER = new Date("2026-09-06T12:12:00.000Z");

describe("session view", () => {
  it("SESSION-DURATION-02 exposes match and wait durations", () => {
    let state = createDefaultSession();
    const first = reduceSession(
      state,
      { type: "JOIN", token: "p-1", name: "Ada" },
      T0,
      Math.random,
      () => "p-1",
    );
    state = first.state;
    for (const [index, name] of ["Bea", "Cara", "Dee"].entries()) {
      state = reduceSession(
        state,
        { type: "JOIN", token: `p-${index + 2}`, name },
        T0,
        Math.random,
        () => `p-${index + 2}`,
      ).state;
    }

    const started = reduceSession(
      state,
      { type: "START_MATCH", playerId: "p-1" },
      T0,
      () => 0,
    );
    const leftover = reduceSession(
      started.state,
      { type: "JOIN", token: "p-5", name: "Eve" },
      T0,
      Math.random,
      () => "p-5",
    ).state;

    const view = toSessionView(leftover, "p-5", LATER);
    expect(view.courts[0]).toMatchObject({
      occupied: true,
      startedAt: T0.toISOString(),
      durationLabel: "12m",
    });
    expect(view.waiting[0]).toMatchObject({
      name: "Eve",
      waitLabel: "12m",
    });
    expect(view.waitingCount).toBe(1);
  });
});
