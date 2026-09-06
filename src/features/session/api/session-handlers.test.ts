import { describe, expect, it } from "vitest";
import { createDefaultSession } from "../model/session";
import { reduceSession } from "../model/session-reducer";
import { createMemorySessionRepository } from "../storage/memory-session-repository";
import {
  handleDoneSession,
  handleGetSession,
  handleJoinSession,
  handleReadySession,
} from "./session-handlers";

const T0 = new Date("2026-09-06T12:00:00.000Z");

function seedWaiting(names: string[]) {
  let state = createDefaultSession();
  names.forEach((name, index) => {
    state = reduceSession(
      state,
      { type: "JOIN", token: `p-${index + 1}`, name },
      T0,
      Math.random,
      () => `p-${index + 1}`,
    ).state;
  });
  return createMemorySessionRepository(state);
}

describe("session handlers", () => {
  it("SESSION-API-01 join conflict → 409 + message", async () => {
    const repository = seedWaiting(["Ada"]);
    const conflict = await handleJoinSession(repository, {
      token: "p-2",
      name: "ada",
    });
    expect(conflict.status).toBe(409);
    expect(conflict.body).toMatchObject({
      error: "name_taken",
      notice: expect.stringMatching(/already in the pool/i),
    });
  });

  it("SESSION-API-02 ready / done happy path", async () => {
    const repository = seedWaiting(["Ada", "Bea", "Cara", "Dee"]);
    const ready = await handleReadySession(repository, { token: "p-1" });
    expect(ready.status).toBe(200);
    if (!("me" in ready.body)) {
      throw new Error("expected session view");
    }
    expect(ready.body.me).toMatchObject({
      id: "p-1",
      status: "on_court",
    });
    expect(ready.body.me?.partners).toHaveLength(3);
    expect(ready.body.waiting).toHaveLength(0);

    const done = await handleDoneSession(repository, { token: "p-2" });
    expect(done.status).toBe(200);
    if (!("waiting" in done.body)) {
      throw new Error("expected session view");
    }
    expect(done.body.waiting).toHaveLength(4);
    expect(done.body.courts.every((court) => !court.occupied)).toBe(true);
  });

  it("GET reports playerMissing for a stale remembered id", async () => {
    const repository = seedWaiting(["Ada"]);
    const view = await handleGetSession(repository, "missing");
    expect(view.status).toBe(200);
    expect(view.body.playerMissing).toBe(true);
    expect(view.body.me).toBeNull();
  });
});
