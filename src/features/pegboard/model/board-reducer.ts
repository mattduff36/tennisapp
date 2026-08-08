import {
  createDefaultBoard,
  createPlayerId,
  normalizePlayerName,
  type BoardState,
  type CourtId,
  type Player,
} from "./board";
import {
  everyPlayerHasOneLocation,
  findPlayer,
  getCourtOccupancy,
  isCourtFull,
} from "./board-selectors";

export type BoardAction =
  | { type: "ADD_PLAYER"; name: string }
  | { type: "RENAME_PLAYER"; playerId: string; name: string }
  | { type: "DELETE_PLAYER"; playerId: string }
  | { type: "ASSIGN_TO_COURT"; playerId: string; courtId: CourtId }
  | { type: "RETURN_TO_WAITING"; playerId: string }
  | { type: "REPLACE_BOARD"; board: BoardState }
  | { type: "RESET_BOARD" };

export type BoardTransitionResult = {
  state: BoardState;
  changed: boolean;
  notice: string | null;
};

function unchanged(state: BoardState, notice: string | null = null): BoardTransitionResult {
  return { state, changed: false, notice };
}

function changed(
  state: BoardState,
  notice: string | null = null,
): BoardTransitionResult {
  return { state, changed: true, notice };
}

function updatePlayer(
  state: BoardState,
  playerId: string,
  updater: (player: Player) => Player,
): BoardState {
  return {
    players: state.players.map((player) =>
      player.id === playerId ? updater(player) : player,
    ),
  };
}

export function reduceBoard(
  state: BoardState,
  action: BoardAction,
): BoardTransitionResult {
  switch (action.type) {
    case "ADD_PLAYER": {
      const name = normalizePlayerName(action.name);
      if (!name) {
        return unchanged(state, "Enter a player name.");
      }

      const player: Player = {
        id: createPlayerId(),
        name,
        location: { kind: "waiting" },
      };

      return changed(
        { players: [...state.players, player] },
        `${name} added to Waiting.`,
      );
    }

    case "RENAME_PLAYER": {
      const name = normalizePlayerName(action.name);
      if (!name) {
        return unchanged(state, "Enter a player name.");
      }

      const player = findPlayer(state, action.playerId);
      if (!player) {
        return unchanged(state, "That player is no longer on the board.");
      }

      if (player.name === name) {
        return unchanged(state);
      }

      return changed(
        updatePlayer(state, action.playerId, (current) => ({
          ...current,
          name,
        })),
        `Renamed to ${name}.`,
      );
    }

    case "DELETE_PLAYER": {
      const player = findPlayer(state, action.playerId);
      if (!player) {
        return unchanged(state, "That player is no longer on the board.");
      }

      return changed(
        {
          players: state.players.filter(
            (current) => current.id !== action.playerId,
          ),
        },
        `${player.name} removed.`,
      );
    }

    case "ASSIGN_TO_COURT": {
      const player = findPlayer(state, action.playerId);
      if (!player) {
        return unchanged(state, "Select a waiting player first.");
      }

      if (player.location.kind !== "waiting") {
        return unchanged(state, `${player.name} is already on a court.`);
      }

      if (isCourtFull(state, action.courtId)) {
        return unchanged(
          state,
          `Court ${action.courtId} is full (4 players).`,
        );
      }

      return changed(
        updatePlayer(state, action.playerId, (current) => ({
          ...current,
          location: { kind: "court", courtId: action.courtId },
        })),
        `${player.name} moved to Court ${action.courtId}.`,
      );
    }

    case "RETURN_TO_WAITING": {
      const player = findPlayer(state, action.playerId);
      if (!player) {
        return unchanged(state, "That player is no longer on the board.");
      }

      if (player.location.kind !== "court") {
        return unchanged(state, `${player.name} is already waiting.`);
      }

      return changed(
        updatePlayer(state, action.playerId, (current) => ({
          ...current,
          location: { kind: "waiting" },
        })),
        `${player.name} returned to Waiting.`,
      );
    }

    case "REPLACE_BOARD": {
      if (!everyPlayerHasOneLocation(action.board)) {
        return unchanged(state, "Board data failed validation.");
      }
      return changed(action.board);
    }

    case "RESET_BOARD":
      return changed(createDefaultBoard(), "Board reset to default players.");

    default:
      return unchanged(state);
  }
}

export function assertCourtCapacityInvariant(state: BoardState): boolean {
  return ([1, 2, 3] as CourtId[]).every(
    (courtId) => getCourtOccupancy(state, courtId) <= 4,
  );
}
