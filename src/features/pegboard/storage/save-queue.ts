import type { BoardState } from "../model/board";
import type { BoardRepository } from "./board-repository";

export type SaveQueue = {
  enqueue(board: BoardState): void;
  blockAndClear(): void;
  unblock(): void;
  /** Resolves when all previously scheduled writes have settled. */
  idle(): Promise<void>;
};

/**
 * Serializes repository writes onto a single promise chain and always writes
 * the latest enqueued board. Reset paths should block, await idle(), then reset
 * storage so an in-flight write cannot repopulate cleared state.
 */
export function createSaveQueue(
  getRepository: () => BoardRepository,
  options?: {
    onStart?: () => void;
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
  },
): SaveQueue {
  let latest: BoardState | null = null;
  let blocked = false;
  let chain: Promise<void> = Promise.resolve();

  function enqueue(board: BoardState): void {
    if (blocked) {
      return;
    }

    latest = board;
    options?.onStart?.();

    chain = chain
      .catch(() => undefined)
      .then(async () => {
        if (blocked) {
          return;
        }

        const snapshot = latest;
        if (!snapshot) {
          return;
        }

        // Another enqueue may replace latest before save starts; write only
        // the newest snapshot at the moment this chain link runs.
        latest = null;

        try {
          if (blocked) {
            return;
          }
          await getRepository().save(snapshot);
          if (!blocked) {
            options?.onSuccess?.();
          }
        } catch (error) {
          if (!blocked) {
            options?.onError?.(error);
          }
        }
      });
  }

  return {
    enqueue,
    blockAndClear() {
      blocked = true;
      latest = null;
    },
    unblock() {
      blocked = false;
    },
    idle() {
      return chain.catch(() => undefined);
    },
  };
}
