import type { BoardState, PersistedBoardV1 } from "../model/board";

export type LoadBoardResult =
  | { status: "empty" }
  | { status: "ok"; board: BoardState; snapshot: PersistedBoardV1 }
  | { status: "corrupt"; reason: string }
  | { status: "unsupported"; version: number };

export interface BoardRepository {
  load(): Promise<LoadBoardResult>;
  save(board: BoardState): Promise<void>;
  reset(): Promise<void>;
}
