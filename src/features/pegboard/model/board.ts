export type CourtId = 1 | 2 | 3;

export const COURT_IDS: readonly CourtId[] = [1, 2, 3];
export const COURT_CAPACITY = 4;
export const BOARD_SCHEMA_VERSION = 2 as const;
export const BOARD_SCHEMA_VERSION_V1 = 1 as const;

export interface PlayerLocationWaiting {
  kind: "waiting";
}

export interface PlayerLocationCourt {
  kind: "court";
  courtId: CourtId;
}

export type PlayerLocation = PlayerLocationWaiting | PlayerLocationCourt;

export interface Player {
  id: string;
  name: string;
  location: PlayerLocation;
  /** ISO-8601 timestamp for when the player entered their current location. */
  locationEnteredAt: string;
}

/** Historical v1 snapshot shape (no timestamps). */
export interface PersistedBoardV1 {
  version: typeof BOARD_SCHEMA_VERSION_V1;
  players: Array<{
    id: string;
    name: string;
    location: PlayerLocation;
  }>;
}

export interface PersistedBoardV2 {
  version: typeof BOARD_SCHEMA_VERSION;
  players: Player[];
}

export type PersistedBoard = PersistedBoardV2;

export interface BoardState {
  players: Player[];
}

export function nowIso(date: Date = new Date()): string {
  return date.toISOString();
}

export function isValidLocationEnteredAt(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return new Date(parsed).toISOString() === value;
}

export function createEmptyBoard(): BoardState {
  return { players: [] };
}

/** Fresh board used on first load and reset: four waiting players. */
export function createDefaultBoard(now: Date = new Date()): BoardState {
  const locationEnteredAt = nowIso(now);
  return {
    players: [1, 2, 3, 4].map((n) => ({
      id: `default-player-${n}`,
      name: `Player ${n}`,
      location: { kind: "waiting" as const },
      locationEnteredAt,
    })),
  };
}

export function createPlayerId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `player-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizePlayerName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : null;
}

export function isCourtId(value: unknown): value is CourtId {
  return value === 1 || value === 2 || value === 3;
}
