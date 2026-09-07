import { describe, expect, it } from "vitest";
import { createDefaultSession } from "../model/session";
import { reduceSession } from "../model/session-reducer";
import { createMemorySessionRepository } from "../storage/memory-session-repository";
import {
  handleClaimSession,
  handleDoneSession,
  handleGetSession,
  handleJoinSession,
  handlePatchSettings,
  handleReadySession,
  handleResetSession,
} from "./session-handlers";
import { handleUnlockPin, handleUpdatePin } from "../pin/pin-handlers";
import { createMemoryPinStore } from "../pin/pin-store";

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

  it("SESSION-API-READY-01 ready without token starts the next court", async () => {
    const repository = seedWaiting(["Ada", "Bea", "Cara", "Dee", "Eve"]);
    const ready = await handleReadySession(repository, {});
    expect(ready.status).toBe(200);
    if (!("courts" in ready.body)) {
      throw new Error("expected session view");
    }
    expect(ready.body.courts[0]?.occupied).toBe(true);
    expect(ready.body.courts[0]?.startedAt).toEqual(expect.any(String));
    expect(ready.body.courts[0]?.players).toHaveLength(4);
    expect(ready.body.waiting).toHaveLength(1);
    expect(ready.body.me).toBeNull();
  });

  it("SESSION-API-PIN-01 settings/reset 401 when locked; 200 after unlock", async () => {
    const repository = createMemorySessionRepository();
    const pinStore = createMemoryPinStore();
    const enabled = await handleUpdatePin(repository, pinStore, {
      action: "enable",
      pin: "1234",
    });
    expect(enabled.status).toBe(200);
    expect(enabled.unlockCookie).toEqual(expect.any(String));

    const locked = { enabled: true, unlocked: false };
    const blockedSettings = await handlePatchSettings(
      repository,
      { readyRule: "random" },
      locked,
    );
    expect(blockedSettings.status).toBe(401);
    expect(blockedSettings.body).toMatchObject({ error: "pin_required" });

    const blockedReset = await handleResetSession(repository, locked);
    expect(blockedReset.status).toBe(401);

    const unlock = await handleUnlockPin(repository, pinStore, { pin: "1234" });
    expect(unlock.status).toBe(200);
    expect(unlock.unlockCookie).toBe(enabled.unlockCookie);

    const open = { enabled: true, unlocked: true };
    const saved = await handlePatchSettings(
      repository,
      { readyRule: "random" },
      open,
    );
    expect(saved.status).toBe(200);
    if (!("settings" in saved.body)) {
      throw new Error("expected settings view");
    }
    expect(saved.body.settings.readyRule).toBe("random");
  });

  it("SESSION-API-PIN-02 enable/disable; PIN off leaves APIs open", async () => {
    const repository = createMemorySessionRepository();
    const pinStore = createMemoryPinStore();
    const enabled = await handleUpdatePin(
      repository,
      pinStore,
      { action: "enable", pin: "2468" },
    );
    expect(enabled.status).toBe(200);
    if (!("settings" in enabled.body)) {
      throw new Error("expected settings view");
    }
    expect(enabled.body.settings.pinEnabled).toBe(true);
    expect(enabled.body.settings.unlocked).toBe(true);

    const disabled = await handleUpdatePin(
      repository,
      pinStore,
      { action: "disable", currentPin: "2468" },
    );
    expect(disabled.status).toBe(200);
    if (!("settings" in disabled.body)) {
      throw new Error("expected settings view");
    }
    expect(disabled.body.settings.pinEnabled).toBe(false);

    const reset = await handleResetSession(repository, {
      enabled: false,
      unlocked: true,
    });
    expect(reset.status).toBe(200);
  });

  it("SESSION-API-CLAIM-01 claim attaches a phone to an unclaimed name", async () => {
    const repository = createMemorySessionRepository();
    const helper = await handleJoinSession(repository, {
      token: "helper",
      name: "Ada",
      claimed: false,
    });
    expect(helper.status).toBe(200);
    const conflict = await handleJoinSession(repository, {
      token: "phone",
      name: "Ada",
    });
    expect(conflict.status).toBe(409);
    expect(conflict.body).toMatchObject({ error: "name_unclaimed" });

    const claimed = await handleClaimSession(repository, {
      token: "phone",
      name: "Ada",
    });
    expect(claimed.status).toBe(200);
    if (!("me" in claimed.body)) {
      throw new Error("expected claimed view");
    }
    expect(claimed.body.me).toMatchObject({ name: "Ada", status: "waiting" });
  });

  it("GET reports playerMissing for a stale remembered id", async () => {
    const repository = seedWaiting(["Ada"]);
    const view = await handleGetSession(repository, "missing");
    expect(view.status).toBe(200);
    expect(view.body.playerMissing).toBe(true);
    expect(view.body.me).toBeNull();
  });
});
