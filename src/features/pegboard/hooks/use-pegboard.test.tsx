import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BoardRepository, LoadBoardResult } from "../storage/board-repository";
import { usePegboard } from "./use-pegboard";

function createMockRepository(initial: LoadBoardResult): {
  repository: BoardRepository;
  saves: unknown[];
} {
  const saves: unknown[] = [];
  let current = initial;

  const repository: BoardRepository = {
    async load() {
      return current;
    },
    async save(board) {
      saves.push(board);
      current = {
        status: "ok",
        board,
        snapshot: { version: 2, players: board.players },
      };
    },
    async reset() {
      current = { status: "empty" };
      saves.length = 0;
    },
  };

  return { repository, saves };
}

describe("usePegboard hydration", () => {
  it("PERSIST-02: does not save before hydration completes", async () => {
    let resolveLoad: ((value: LoadBoardResult) => void) | null = null;
    const saves: unknown[] = [];

    const repository: BoardRepository = {
      load: () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
      async save(board) {
        saves.push(board);
      },
      async reset() {},
    };

    const { result } = renderHook(() => usePegboard(() => repository));

    expect(result.current.persistenceStatus).toBe("loading");
    expect(result.current.canInteract).toBe(false);
    expect(saves).toHaveLength(0);

    await act(async () => {
      resolveLoad?.({ status: "empty" });
    });

    await waitFor(() => {
      expect(result.current.canInteract).toBe(true);
    });

    // Empty storage seeds the default four players and persists after hydrate.
    await waitFor(() => {
      expect(saves.length).toBeGreaterThan(0);
    });
    expect(
      (saves[0] as { players: Array<{ name: string }> }).players.map(
        (player) => player.name,
      ),
    ).toEqual(["Player 1", "Player 2", "Player 3", "Player 4"]);
  });

  it("keeps save blocked for unsupported newer storage", async () => {
    const { repository, saves } = createMockRepository({
      status: "unsupported",
      version: 99,
    });

    const { result } = renderHook(() => usePegboard(() => repository));

    await waitFor(() => {
      expect(result.current.persistenceStatus).toBe("unsupported");
    });

    act(() => {
      result.current.addPlayer("Should not persist");
    });

    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(saves).toHaveLength(0);
  });

  it("MIGRATE-01: migrated v1 boards are written back as dirty saves", async () => {
    const { repository, saves } = createMockRepository({
      status: "ok",
      board: {
        players: [
          {
            id: "a",
            name: "Ada",
            location: { kind: "waiting" },
            locationEnteredAt: "2026-08-08T12:00:00.000Z",
          },
        ],
      },
      snapshot: {
        version: 2,
        players: [
          {
            id: "a",
            name: "Ada",
            location: { kind: "waiting" },
            locationEnteredAt: "2026-08-08T12:00:00.000Z",
          },
        ],
      },
      migratedFromVersion: 1,
    });

    renderHook(() => usePegboard(() => repository));

    await waitFor(() => {
      expect(saves.length).toBeGreaterThan(0);
    });
    expect(
      (saves[0] as { players: Array<{ locationEnteredAt: string }> }).players[0]
        ?.locationEnteredAt,
    ).toBe("2026-08-08T12:00:00.000Z");
  });
});
