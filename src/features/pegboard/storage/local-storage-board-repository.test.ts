import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOARD_SCHEMA_VERSION, type BoardState } from "../model/board";
import {
  BOARD_STORAGE_KEY,
  createLocalStorageBoardRepository,
  parsePersistedBoard,
  serializeBoard,
} from "./local-storage-board-repository";

const T0 = new Date("2026-08-08T12:00:00.000Z");
const T0_ISO = "2026-08-08T12:00:00.000Z";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("local storage board repository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("PERSIST-V2-01: valid v2 snapshot round-trips equivalently", async () => {
    const storage = memoryStorage();
    const repo = createLocalStorageBoardRepository(storage);
    const board: BoardState = {
      players: [
        {
          id: "a",
          name: "Ada",
          location: { kind: "waiting" },
          locationEnteredAt: "2026-08-01T10:00:00.000Z",
        },
        {
          id: "b",
          name: "Bea",
          location: { kind: "court", courtId: 2 },
          locationEnteredAt: "2026-08-01T11:00:00.000Z",
        },
      ],
    };

    await repo.save(board);
    const loaded = await repo.load();
    expect(loaded.status).toBe("ok");
    if (loaded.status === "ok") {
      expect(loaded.board).toEqual(board);
      expect(loaded.snapshot).toEqual(serializeBoard(board));
      expect(loaded.snapshot.version).toBe(2);
      expect(loaded.migratedFromVersion).toBeUndefined();
    }
    expect(storage.getItem(BOARD_STORAGE_KEY)).toContain('"version":2');
  });

  it("PERSIST-V2-01: invalid timestamps are corrupt; v3 unsupported and unchanged", async () => {
    const invalid = parsePersistedBoard(
      JSON.stringify({
        version: 2,
        players: [
          {
            id: "a",
            name: "Ada",
            location: { kind: "waiting" },
            locationEnteredAt: "not-a-date",
          },
        ],
      }),
    );
    expect(invalid.status).toBe("corrupt");

    const storage = memoryStorage();
    storage.setItem(
      BOARD_STORAGE_KEY,
      JSON.stringify({ version: BOARD_SCHEMA_VERSION + 1, players: [] }),
    );
    const repo = createLocalStorageBoardRepository(storage);
    const loaded = await repo.load();
    expect(loaded.status).toBe("unsupported");
    if (loaded.status === "unsupported") {
      expect(loaded.version).toBe(BOARD_SCHEMA_VERSION + 1);
    }
    expect(storage.getItem(BOARD_STORAGE_KEY)).toContain(
      `"version":${BOARD_SCHEMA_VERSION + 1}`,
    );
    expect(BOARD_STORAGE_KEY).toBe("tennisapp.pegboard.v1");
  });

  it("MIGRATE-01: v1 snapshot migrates with frozen timestamp and persists as v2", async () => {
    const storage = memoryStorage();
    storage.setItem(
      BOARD_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        players: [
          { id: "a", name: "Ada", location: { kind: "waiting" } },
          { id: "b", name: "Bea", location: { kind: "court", courtId: 2 } },
        ],
      }),
    );

    const first = parsePersistedBoard(
      storage.getItem(BOARD_STORAGE_KEY)!,
      T0,
    );
    expect(first.status).toBe("ok");
    if (first.status !== "ok") {
      return;
    }

    expect(first.migratedFromVersion).toBe(1);
    expect(first.board.players).toEqual([
      {
        id: "a",
        name: "Ada",
        location: { kind: "waiting" },
        locationEnteredAt: T0_ISO,
      },
      {
        id: "b",
        name: "Bea",
        location: { kind: "court", courtId: 2 },
        locationEnteredAt: T0_ISO,
      },
    ]);

    const repo = createLocalStorageBoardRepository(storage);
    await repo.save(first.board);

    const second = await repo.load();
    expect(second.status).toBe("ok");
    if (second.status === "ok") {
      expect(second.migratedFromVersion).toBeUndefined();
      expect(second.board.players[0]!.locationEnteredAt).toBe(T0_ISO);
      expect(second.board.players[1]!.locationEnteredAt).toBe(T0_ISO);
      expect(second.snapshot.version).toBe(2);
    }
  });

  it("PERSIST-03: malformed data does not crash and reports corrupt", () => {
    const result = parsePersistedBoard("{not-json");
    expect(result.status).toBe("corrupt");
  });

  it("reset removes only the app storage key", async () => {
    const storage = memoryStorage();
    storage.setItem("other", "keep");
    const repo = createLocalStorageBoardRepository(storage);
    await repo.save({ players: [] });
    await repo.reset();
    expect(storage.getItem(BOARD_STORAGE_KEY)).toBeNull();
    expect(storage.getItem("other")).toBe("keep");
  });
});
