export type GameMode = "singles" | "doubles";
export type PlayerStatus = "waiting" | "on_court";

export const MIN_COURT_COUNT = 1;
export const MAX_COURT_COUNT = 8;
export const SESSION_SETTINGS_ID = 1;

export const REQUIRED_PLAYERS: Record<GameMode, number> = {
  singles: 2,
  doubles: 4,
};

export type SessionErrorCode =
  | "empty_name"
  | "name_taken"
  | "player_not_found"
  | "not_waiting"
  | "need_players"
  | "no_free_court"
  | "not_on_court"
  | "occupied_court"
  | "invalid_settings"
  | "court_not_found"
  | "court_name_taken";

export interface SessionSettings {
  courtCount: number;
  gameMode: GameMode;
}

export interface SessionCourt {
  id: string;
  sortOrder: number;
  name: string;
  nameKey: string;
}

export interface SessionPlayer {
  id: string;
  token: string;
  name: string;
  nameKey: string;
  status: PlayerStatus;
  courtId: string | null;
  joinedAt: string;
}

export interface SessionState {
  settings: SessionSettings;
  courts: SessionCourt[];
  players: SessionPlayer[];
}

export function nowIso(date: Date = new Date()): string {
  return date.toISOString();
}

export function createEntityId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeDisplayName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : null;
}

export function toNameKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function requiredPlayers(mode: GameMode): number {
  return REQUIRED_PLAYERS[mode];
}

export function isGameMode(value: unknown): value is GameMode {
  return value === "singles" || value === "doubles";
}

export function createDefaultSession(): SessionState {
  return {
    settings: {
      courtCount: 3,
      gameMode: "doubles",
    },
    courts: [1, 2, 3].map((n) => ({
      id: `default-court-${n}`,
      sortOrder: n,
      name: `Court ${n}`,
      nameKey: `court ${n}`,
    })),
    players: [],
  };
}

export function cloneSession(state: SessionState): SessionState {
  return {
    settings: { ...state.settings },
    courts: state.courts.map((court) => ({ ...court })),
    players: state.players.map((player) => ({ ...player })),
  };
}
