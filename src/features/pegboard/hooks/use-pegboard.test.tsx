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
        snapshot: { version: 1, players: board.players },
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
      expect(result.current.persistenceStatus).toBe("ready");
    });

    expect(saves).toHaveLength(0);

    act(() => {
      result.current.addPlayer("Ada");
    });

    await waitFor(() => {
      expect(saves.length).toBeGreaterThan(0);
    });
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
});
