export type CourtId = 1 | 2 | 3;

export const COURT_IDS: readonly CourtId[] = [1, 2, 3];
export const COURT_CAPACITY = 4;
export const BOARD_SCHEMA_VERSION = 1 as const;

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
}

export interface PersistedBoardV1 {
  version: typeof BOARD_SCHEMA_VERSION;
  players: Player[];
}

export interface BoardState {
  players: Player[];
}

export function createEmptyBoard(): BoardState {
  return { players: [] };
}

/** Fresh board used on first load and reset: four waiting players. */
export function createDefaultBoard(): BoardState {
  return {
    players: [1, 2, 3, 4].map((n) => ({
      id: `default-player-${n}`,
      name: `Player ${n}`,
      location: { kind: "waiting" as const },
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
