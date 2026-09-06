export const PLAYER_IDENTITY_KEY = "tennisapp.me.v1";
export const PLAYER_IDENTITY_EVENT = "tennisapp-identity";

function emitIdentityChange() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(PLAYER_IDENTITY_EVENT));
}

export function subscribePlayerIdentity(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PLAYER_IDENTITY_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PLAYER_IDENTITY_EVENT, onStoreChange);
  };
}

export function getPlayerIdentitySnapshot(): string | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage.getItem(PLAYER_IDENTITY_KEY);
}

export type PlayerIdentity = {
  version: 2;
  token: string;
  name: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parsePlayerIdentity(value: unknown): PlayerIdentity | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.name !== "string" || value.name.trim().length === 0) {
    return null;
  }
  if (value.version === 2 && typeof value.token === "string" && value.token.length > 0) {
    return { version: 2, token: value.token, name: value.name };
  }
  if (value.version === 1 && typeof value.id === "string" && value.id.length > 0) {
    return { version: 2, token: value.id, name: value.name };
  }
  return null;
}

export function readPlayerIdentity(
  storage: Pick<Storage, "getItem"> | null = typeof localStorage === "undefined"
    ? null
    : localStorage,
): PlayerIdentity | null {
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(PLAYER_IDENTITY_KEY);
    if (!raw) {
      return null;
    }
    return parsePlayerIdentity(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writePlayerIdentity(
  identity: PlayerIdentity,
  storage: Pick<Storage, "setItem"> | null = typeof localStorage === "undefined"
    ? null
    : localStorage,
): void {
  if (!storage) {
    return;
  }
  storage.setItem(PLAYER_IDENTITY_KEY, JSON.stringify(identity));
  if (typeof localStorage !== "undefined" && storage === localStorage) {
    emitIdentityChange();
  }
}

export function clearPlayerIdentity(
  storage: Pick<Storage, "removeItem"> | null = typeof localStorage === "undefined"
    ? null
    : localStorage,
): void {
  if (!storage) {
    return;
  }
  storage.removeItem(PLAYER_IDENTITY_KEY);
  if (typeof localStorage !== "undefined" && storage === localStorage) {
    emitIdentityChange();
  }
}

export function createPlayerIdentity(
  name: string,
  token = crypto.randomUUID(),
): PlayerIdentity {
  return { version: 2, token, name };
}
