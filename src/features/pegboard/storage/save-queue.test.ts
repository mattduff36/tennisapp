import { describe, expect, it, vi } from "vitest";
import type { BoardState } from "../model/board";
import type { BoardRepository } from "./board-repository";
import { createSaveQueue } from "./save-queue";

function board(name: string): BoardState {
  return {
    players: [{ id: name, name, location: { kind: "waiting" } }],
  };
}

describe("save queue", () => {
  it("serializes writes and coalesces to the latest board", async () => {
    const writes: string[] = [];
    let releaseFirst!: () => void;

    const repository: BoardRepository = {
      async load() {
        return { status: "empty" };
      },
      async save(state) {
        if (writes.length === 0) {
          await new Promise<void>((resolve) => {
            releaseFirst = resolve;
          });
        }
        writes.push(state.players[0]!.name);
      },
      async reset() {},
    };

    const queue = createSaveQueue(() => repository);
    queue.enqueue(board("one"));
    await Promise.resolve();
    await Promise.resolve();
    queue.enqueue(board("two"));
    queue.enqueue(board("three"));

    releaseFirst();
    await queue.idle();
    expect(writes).toEqual(["one", "three"]);
  });

  it("does not enqueue while blocked and writes again after unblock", async () => {
    const writes: string[] = [];

    const repository: BoardRepository = {
      async load() {
        return { status: "empty" };
      },
      async save(state) {
        writes.push(state.players[0]!.name);
      },
      async reset() {},
    };

    const queue = createSaveQueue(() => repository);
    queue.blockAndClear();
    queue.enqueue(board("ignored"));
    await queue.idle();
    expect(writes).toEqual([]);

    queue.unblock();
    queue.enqueue(board("fresh"));
    await queue.idle();
    expect(writes).toEqual(["fresh"]);
  });

  it("ignores success callbacks when blocked mid-flight", async () => {
    const onSuccess = vi.fn();
    let release!: () => void;

    const repository: BoardRepository = {
      async load() {
        return { status: "empty" };
      },
      async save() {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      },
      async reset() {},
    };

    const queue = createSaveQueue(() => repository, { onSuccess });
    queue.enqueue(board("a"));
    await Promise.resolve();
    await Promise.resolve();
    queue.blockAndClear();
    release();
    await queue.idle();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
