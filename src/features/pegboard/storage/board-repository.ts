import type { BoardState, PersistedBoardV2 } from "../model/board";

export type LoadBoardResult =
  | { status: "empty" }
  | {
      status: "ok";
      board: BoardState;
      snapshot: PersistedBoardV2;
      /** Set when a historical v1 snapshot was migrated in-memory to v2. */
      migratedFromVersion?: 1;
    }
  | { status: "corrupt"; reason: string }
  | { status: "unsupported"; version: number };

export interface BoardRepository {
  load(): Promise<LoadBoardResult>;
  save(board: BoardState): Promise<void>;
  reset(): Promise<void>;
}
