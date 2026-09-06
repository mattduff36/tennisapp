import type { SessionErrorCode } from "../model/session";

export type SessionHttpResult<T> = {
  status: number;
  body: T;
};

export function statusForSessionError(error: SessionErrorCode): number {
  switch (error) {
    case "empty_name":
    case "invalid_settings":
      return 400;
    case "player_not_found":
    case "court_not_found":
      return 404;
    default:
      return 409;
  }
}

export function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
