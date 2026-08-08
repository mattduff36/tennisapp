import {
  BOARD_SCHEMA_VERSION,
  BOARD_SCHEMA_VERSION_V1,
  isCourtId,
  isValidLocationEnteredAt,
  nowIso,
  type BoardState,
  type PersistedBoardV2,
  type Player,
  type PlayerLocation,
} from "../model/board";
import type { BoardRepository, LoadBoardResult } from "./board-repository";

export const BOARD_STORAGE_KEY = "tennisapp.pegboard.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseLocation(value: unknown): PlayerLocation | null {
  if (!isRecord(value) || typeof value.kind !== "string") {
    return null;
  }

  if (value.kind === "waiting") {
    return { kind: "waiting" };
  }

  if (value.kind === "court" && isCourtId(value.courtId)) {
    return { kind: "court", courtId: value.courtId };
  }

  return null;
}

function parsePlayerV1(
  value: unknown,
  locationEnteredAt: string,
): Player | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    return null;
  }

  if (typeof value.name !== "string" || value.name.trim().length === 0) {
    return null;
  }

  const location = parseLocation(value.location);
  if (!location) {
    return null;
  }

  return {
    id: value.id,
    name: value.name.trim(),
    location,
    locationEnteredAt,
  };
}

function parsePlayerV2(value: unknown): Player | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    return null;
  }

  if (typeof value.name !== "string" || value.name.trim().length === 0) {
    return null;
  }

  if (!isValidLocationEnteredAt(value.locationEnteredAt)) {
    return null;
  }

  const location = parseLocation(value.location);
  if (!location) {
    return null;
  }

  return {
    id: value.id,
    name: value.name.trim(),
    location,
    locationEnteredAt: value.locationEnteredAt,
  };
}

function validatePlayerSet(players: Player[]): string | null {
  const ids = new Set<string>();
  const courtCounts = new Map<number, number>([
    [1, 0],
    [2, 0],
    [3, 0],
  ]);

  for (const player of players) {
    if (ids.has(player.id)) {
      return "Stored board contains duplicate player ids.";
    }
    ids.add(player.id);

    if (player.location.kind === "court") {
      const next = (courtCounts.get(player.location.courtId) ?? 0) + 1;
      if (next > 4) {
        return `Court ${player.location.courtId} exceeds capacity.`;
      }
      courtCounts.set(player.location.courtId, next);
    }
  }

  return null;
}

export function parsePersistedBoard(
  raw: string,
  now: Date = new Date(),
): LoadBoardResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "corrupt", reason: "Stored board is not valid JSON." };
  }

  if (!isRecord(parsed)) {
    return { status: "corrupt", reason: "Stored board must be an object." };
  }

  if (typeof parsed.version !== "number") {
    return { status: "corrupt", reason: "Stored board is missing a version." };
  }

  if (parsed.version > BOARD_SCHEMA_VERSION) {
    return { status: "unsupported", version: parsed.version };
  }

  if (
    parsed.version !== BOARD_SCHEMA_VERSION &&
    parsed.version !== BOARD_SCHEMA_VERSION_V1
  ) {
    return {
      status: "corrupt",
      reason: `Unsupported legacy board version ${parsed.version}.`,
    };
  }

  if (!Array.isArray(parsed.players)) {
    return { status: "corrupt", reason: "Stored board players must be an array." };
  }

  const migratedFromVersion =
    parsed.version === BOARD_SCHEMA_VERSION_V1 ? (1 as const) : undefined;
  const migrationNow = nowIso(now);
  const players: Player[] = [];

  for (const item of parsed.players) {
    const player =
      migratedFromVersion === 1
        ? parsePlayerV1(item, migrationNow)
        : parsePlayerV2(item);

    if (!player) {
      return {
        status: "corrupt",
        reason: "Stored board contains an invalid player.",
      };
    }

    players.push(player);
  }

  const validationError = validatePlayerSet(players);
  if (validationError) {
    return { status: "corrupt", reason: validationError };
  }

  const snapshot: PersistedBoardV2 = {
    version: BOARD_SCHEMA_VERSION,
    players,
  };

  return {
    status: "ok",
    board: { players: [...players] },
    snapshot,
    ...(migratedFromVersion === 1 ? { migratedFromVersion } : {}),
  };
}

export function serializeBoard(board: BoardState): PersistedBoardV2 {
  return {
    version: BOARD_SCHEMA_VERSION,
    players: board.players.map((player) => ({
      id: player.id,
      name: player.name,
      location:
        player.location.kind === "waiting"
          ? { kind: "waiting" }
          : { kind: "court", courtId: player.location.courtId },
      locationEnteredAt: player.locationEnteredAt,
    })),
  };
}

export function createLocalStorageBoardRepository(
  storage: Storage = localStorage,
): BoardRepository {
  return {
    async load(): Promise<LoadBoardResult> {
      const raw = storage.getItem(BOARD_STORAGE_KEY);
      if (raw === null || raw.trim() === "") {
        return { status: "empty" };
      }

      return parsePersistedBoard(raw);
    },

    async save(board: BoardState): Promise<void> {
      const snapshot = serializeBoard(board);
      storage.setItem(BOARD_STORAGE_KEY, JSON.stringify(snapshot));
    },

    async reset(): Promise<void> {
      storage.removeItem(BOARD_STORAGE_KEY);
    },
  };
}
