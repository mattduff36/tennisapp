import {
  BOARD_SCHEMA_VERSION,
  isCourtId,
  type BoardState,
  type PersistedBoardV1,
  type Player,
} from "../model/board";
import type { BoardRepository, LoadBoardResult } from "./board-repository";

export const BOARD_STORAGE_KEY = "tennisapp.pegboard.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePlayer(value: unknown): Player | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    return null;
  }

  if (typeof value.name !== "string" || value.name.trim().length === 0) {
    return null;
  }

  if (!isRecord(value.location) || typeof value.location.kind !== "string") {
    return null;
  }

  if (value.location.kind === "waiting") {
    return {
      id: value.id,
      name: value.name.trim(),
      location: { kind: "waiting" },
    };
  }

  if (value.location.kind === "court" && isCourtId(value.location.courtId)) {
    return {
      id: value.id,
      name: value.name.trim(),
      location: { kind: "court", courtId: value.location.courtId },
    };
  }

  return null;
}

export function parsePersistedBoard(raw: string): LoadBoardResult {
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

  if (parsed.version !== BOARD_SCHEMA_VERSION) {
    return {
      status: "corrupt",
      reason: `Unsupported legacy board version ${parsed.version}.`,
    };
  }

  if (!Array.isArray(parsed.players)) {
    return { status: "corrupt", reason: "Stored board players must be an array." };
  }

  const players: Player[] = [];
  const ids = new Set<string>();
  const courtCounts = new Map<number, number>([
    [1, 0],
    [2, 0],
    [3, 0],
  ]);

  for (const item of parsed.players) {
    const player = parsePlayer(item);
    if (!player) {
      return { status: "corrupt", reason: "Stored board contains an invalid player." };
    }

    if (ids.has(player.id)) {
      return { status: "corrupt", reason: "Stored board contains duplicate player ids." };
    }
    ids.add(player.id);

    if (player.location.kind === "court") {
      const next = (courtCounts.get(player.location.courtId) ?? 0) + 1;
      if (next > 4) {
        return {
          status: "corrupt",
          reason: `Court ${player.location.courtId} exceeds capacity.`,
        };
      }
      courtCounts.set(player.location.courtId, next);
    }

    players.push(player);
  }

  const snapshot: PersistedBoardV1 = {
    version: BOARD_SCHEMA_VERSION,
    players,
  };

  return {
    status: "ok",
    board: { players: [...players] },
    snapshot,
  };
}

export function serializeBoard(board: BoardState): PersistedBoardV1 {
  return {
    version: BOARD_SCHEMA_VERSION,
    players: board.players.map((player) => ({
      id: player.id,
      name: player.name,
      location:
        player.location.kind === "waiting"
          ? { kind: "waiting" }
          : { kind: "court", courtId: player.location.courtId },
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
