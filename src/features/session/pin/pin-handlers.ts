import { handleGetSession } from "../api/session-handlers";
import type { SessionHttpResult } from "../api/session-http";
import { isRecord, readString } from "../api/session-http";
import type { SessionView } from "../model/session-view";
import type { SessionRepository } from "../storage/session-repository";
import type { PinStore } from "./pin-store";
import {
  createUnlockToken,
  emptyPinRecord,
  hashPin,
  isPinEnabled,
  isValidPin,
  pinAccessFrom,
  verifyPin,
} from "./settings-pin";

export type PinMutationBody = SessionView & {
  notice: string | null;
  error: string | null;
};

export type PinHandlerResult = SessionHttpResult<
  PinMutationBody | { error: string; notice: string }
> & {
  unlockCookie?: string | null;
};

async function viewResult(
  repository: SessionRepository,
  store: PinStore,
  unlockCookie: string | null,
  notice: string,
  status = 200,
  error: string | null = null,
): Promise<PinHandlerResult> {
  const record = await store.load();
  const pin = pinAccessFrom(record, unlockCookie);
  const view = await handleGetSession(repository, null, pin);
  return {
    status,
    unlockCookie,
    body: {
      ...view.body,
      notice,
      error,
    },
  };
}

export async function handleUnlockPin(
  repository: SessionRepository,
  store: PinStore,
  payload: unknown,
): Promise<PinHandlerResult> {
  if (!isRecord(payload)) {
    return { status: 400, body: { error: "invalid_pin", notice: "Enter the club PIN." } };
  }
  const pin = readString(payload.pin);
  if (!pin || !isValidPin(pin)) {
    return {
      status: 400,
      body: { error: "invalid_pin", notice: "PIN must be 4 to 8 digits." },
    };
  }
  const record = await store.load();
  if (!isPinEnabled(record)) {
    return viewResult(repository, store, null, "No club PIN is set.", 200);
  }
  if (!verifyPin(pin, record) || !record.unlockToken) {
    return {
      status: 401,
      body: { error: "pin_required", notice: "That PIN is not correct." },
    };
  }
  return viewResult(repository, store, record.unlockToken, "Settings unlocked.");
}

export async function handleUpdatePin(
  repository: SessionRepository,
  store: PinStore,
  payload: unknown,
): Promise<PinHandlerResult> {
  if (!isRecord(payload)) {
    return { status: 400, body: { error: "invalid_pin", notice: "Choose a PIN action." } };
  }
  const action = readString(payload.action);
  const pin = readString(payload.pin);
  const currentPin = readString(payload.currentPin);
  const record = await store.load();
  const enabled = isPinEnabled(record);

  if (action === "enable") {
    if (enabled) {
      return {
        status: 409,
        body: { error: "pin_enabled", notice: "A club PIN is already set." },
      };
    }
    if (!pin || !isValidPin(pin)) {
      return {
        status: 400,
        body: { error: "invalid_pin", notice: "PIN must be 4 to 8 digits." },
      };
    }
    const hashed = hashPin(pin);
    const unlockToken = createUnlockToken();
    await store.save({ ...hashed, unlockToken });
    return viewResult(repository, store, unlockToken, "Club PIN is on.");
  }

  if (action === "change") {
    if (!enabled) {
      return {
        status: 409,
        body: { error: "pin_disabled", notice: "No club PIN is set." },
      };
    }
    if (!currentPin || !verifyPin(currentPin, record)) {
      return {
        status: 401,
        body: { error: "pin_required", notice: "Enter the current PIN." },
      };
    }
    if (!pin || !isValidPin(pin)) {
      return {
        status: 400,
        body: { error: "invalid_pin", notice: "New PIN must be 4 to 8 digits." },
      };
    }
    const hashed = hashPin(pin);
    const unlockToken = createUnlockToken();
    await store.save({ ...hashed, unlockToken });
    return viewResult(repository, store, unlockToken, "Club PIN updated.");
  }

  if (action === "disable") {
    if (!enabled) {
      return viewResult(repository, store, null, "No club PIN is set.");
    }
    if (!currentPin || !verifyPin(currentPin, record)) {
      return {
        status: 401,
        body: { error: "pin_required", notice: "Enter the current PIN." },
      };
    }
    await store.save(emptyPinRecord());
    return viewResult(repository, store, null, "Club PIN is off.");
  }

  return { status: 400, body: { error: "invalid_pin", notice: "Choose a PIN action." } };
}

export async function loadPinAccess(store: PinStore, unlockCookie: string | null) {
  return pinAccessFrom(await store.load(), unlockCookie);
}
