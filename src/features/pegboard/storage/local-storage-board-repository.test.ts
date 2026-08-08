import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOARD_SCHEMA_VERSION, type BoardState } from "../model/board";
import {
  BOARD_STORAGE_KEY,
  createLocalStorageBoardRepository,
  parsePersistedBoard,
  serializeBoard,
} from "./local-storage-board-repository";

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

  it("PERSIST-01: valid v1 snapshot round-trips equivalently", async () => {
    const storage = memoryStorage();
    const repo = createLocalStorageBoardRepository(storage);
    const board: BoardState = {
      players: [
        {
          id: "a",
          name: "Ada",
          location: { kind: "waiting" },
        },
        {
          id: "b",
          name: "Bea",
          location: { kind: "court", courtId: 2 },
        },
      ],
    };

    await repo.save(board);
    const loaded = await repo.load();
    expect(loaded.status).toBe("ok");
    if (loaded.status === "ok") {
      expect(loaded.board).toEqual(board);
      expect(loaded.snapshot).toEqual(serializeBoard(board));
    }
  });

  it("PERSIST-03: malformed data does not crash and reports corrupt", () => {
    const result = parsePersistedBoard("{not-json");
    expect(result.status).toBe("corrupt");
  });

  it("PERSIST-04: unsupported newer version is not treated as writable ok", async () => {
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

    // Existing newer payload must remain until explicit reset.
    expect(storage.getItem(BOARD_STORAGE_KEY)).toContain(
      `"version":${BOARD_SCHEMA_VERSION + 1}`,
    );
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
