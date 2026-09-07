import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const PIN_COOKIE_NAME = "tennisapp.settings.unlock";
export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 8;

export type PinRecord = {
  hash: string | null;
  salt: string | null;
  unlockToken: string | null;
};

export function emptyPinRecord(): PinRecord {
  return { hash: null, salt: null, unlockToken: null };
}

export function isPinEnabled(record: PinRecord): boolean {
  return Boolean(record.hash && record.salt && record.unlockToken);
}

export function isValidPin(value: string): boolean {
  return new RegExp(`^\\d{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`).test(value);
}

export function hashPin(
  pin: string,
  salt = randomBytes(16).toString("hex"),
): { hash: string; salt: string } {
  return {
    hash: scryptSync(pin, salt, 64).toString("hex"),
    salt,
  };
}

export function verifyPin(pin: string, record: PinRecord): boolean {
  if (!record.hash || !record.salt) {
    return false;
  }
  const next = scryptSync(pin, record.salt, 64);
  const previous = Buffer.from(record.hash, "hex");
  if (next.length !== previous.length) {
    return false;
  }
  return timingSafeEqual(next, previous);
}

export function createUnlockToken(): string {
  return crypto.randomUUID();
}

export function readCookieValue(
  header: string | null | undefined,
  name: string,
): string | null {
  if (!header) {
    return null;
  }
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }
    if (trimmed.slice(0, separator) === name) {
      return decodeURIComponent(trimmed.slice(separator + 1));
    }
  }
  return null;
}

export function pinAccessFrom(record: PinRecord, unlockCookie: string | null) {
  const enabled = isPinEnabled(record);
  return {
    enabled,
    unlocked: enabled ? unlockCookie === record.unlockToken : true,
  };
}
