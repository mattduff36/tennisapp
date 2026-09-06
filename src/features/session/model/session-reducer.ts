import {
  createEntityId,
  MAX_COURT_COUNT,
  MIN_COURT_COUNT,
  normalizeDisplayName,
  nowIso,
  requiredPlayers,
  toNameKey,
  type GameMode,
  type SessionCourt,
  type SessionErrorCode,
  type SessionPlayer,
  type SessionState,
} from "./session";
import {
  findCourt,
  findPlayer,
  findPlayerByNameKey,
  findPlayerByToken,
  getCourtPlayers,
  getFreeCourts,
  getOccupiedCourtCount,
  getWaitingPlayers,
  isCourtOccupied,
  pickRandomItems,
} from "./session-selectors";

export type SessionAction =
  | { type: "JOIN"; token: string; name: string }
  | { type: "START_MATCH"; playerId: string }
  | { type: "END_MATCH"; playerId: string }
  | { type: "CLEAR_COURT"; courtId: string }
  | { type: "LEAVE"; playerId: string }
  | { type: "REMOVE_PLAYER"; playerId: string }
  | { type: "RENAME_PLAYER"; playerId: string; name: string }
  | { type: "RENAME_COURT"; courtId: string; name: string }
  | {
      type: "UPDATE_SETTINGS";
      courtCount?: number;
      gameMode?: GameMode;
    }
  | { type: "RESET_SESSION" };

export type SessionTransition = {
  state: SessionState;
  changed: boolean;
  error: SessionErrorCode | null;
  notice: string | null;
  selectedPlayerIds?: string[];
  courtId?: string;
};

function unchanged(
  state: SessionState,
  error: SessionErrorCode | null = null,
  notice: string | null = null,
): SessionTransition {
  return { state, changed: false, error, notice };
}

function changed(
  state: SessionState,
  notice: string | null = null,
  extra: Partial<Pick<SessionTransition, "selectedPlayerIds" | "courtId">> = {},
): SessionTransition {
  return { state, changed: true, error: null, notice, ...extra };
}

function nextCourtName(existingKeys: Set<string>, sortOrder: number): string {
  let candidate = `Court ${sortOrder}`;
  let suffix = 2;
  while (existingKeys.has(toNameKey(candidate))) {
    candidate = `Court ${sortOrder} (${suffix})`;
    suffix += 1;
  }
  return candidate;
}

function syncCourtCount(
  state: SessionState,
  courtCount: number,
  createId: () => string,
): SessionState | SessionErrorCode {
  if (
    !Number.isInteger(courtCount) ||
    courtCount < MIN_COURT_COUNT ||
    courtCount > MAX_COURT_COUNT
  ) {
    return "invalid_settings";
  }

  const occupied = getOccupiedCourtCount(state);
  if (courtCount < occupied) {
    return "occupied_court";
  }

  const ordered = state.courts.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  if (courtCount > ordered.length) {
    const keys = new Set(ordered.map((court) => court.nameKey));
    const added: SessionCourt[] = [];
    for (let sortOrder = ordered.length + 1; sortOrder <= courtCount; sortOrder += 1) {
      const name = nextCourtName(keys, sortOrder);
      keys.add(toNameKey(name));
      added.push({
        id: createId(),
        sortOrder,
        name,
        nameKey: toNameKey(name),
      });
    }
    return {
      ...state,
      settings: { ...state.settings, courtCount },
      courts: [...ordered, ...added],
    };
  }

  if (courtCount < ordered.length) {
    const keep = ordered.slice(0, courtCount);
    const remove = ordered.slice(courtCount);
    if (remove.some((court) => isCourtOccupied(state, court.id))) {
      return "occupied_court";
    }
    return {
      ...state,
      settings: { ...state.settings, courtCount },
      courts: keep,
    };
  }

  return {
    ...state,
    settings: { ...state.settings, courtCount },
  };
}

function returnCourtToWaiting(
  state: SessionState,
  courtId: string,
  now: Date,
): SessionState {
  const joinedAt = nowIso(now);
  return {
    ...state,
    players: state.players.map((player) =>
      player.courtId === courtId
        ? {
            ...player,
            status: "waiting" as const,
            courtId: null,
            joinedAt,
          }
        : player,
    ),
  };
}

export function reduceSession(
  state: SessionState,
  action: SessionAction,
  now: Date = new Date(),
  random: () => number = Math.random,
  createId: () => string = createEntityId,
): SessionTransition {
  switch (action.type) {
    case "JOIN": {
      const existing = findPlayerByToken(state, action.token);
      if (existing) {
        return unchanged(state);
      }

      const name = normalizeDisplayName(action.name);
      if (!name) {
        return unchanged(state, "empty_name", "Enter a player name.");
      }

      const nameKey = toNameKey(name);
      if (findPlayerByNameKey(state, nameKey)) {
        return unchanged(
          state,
          "name_taken",
          "That name is already in the pool. Pick a different name.",
        );
      }

      const player: SessionPlayer = {
        id: createId(),
        token: action.token,
        name,
        nameKey,
        status: "waiting",
        courtId: null,
        joinedAt: nowIso(now),
      };

      return changed(
        { ...state, players: [...state.players, player] },
        `${name} joined the pool.`,
      );
    }

    case "START_MATCH": {
      const requester = findPlayer(state, action.playerId);
      if (!requester) {
        return unchanged(state, "player_not_found", "You are not in the pool.");
      }
      if (requester.status !== "waiting") {
        return unchanged(state, "not_waiting", "You are already on a court.");
      }

      const required = requiredPlayers(state.settings.gameMode);
      const waiting = getWaitingPlayers(state);
      if (waiting.length < required) {
        const needed = required - waiting.length;
        return unchanged(
          state,
          "need_players",
          needed === 1 ? "Need 1 more player." : `Need ${needed} more players.`,
        );
      }

      const freeCourt = getFreeCourts(state)[0];
      if (!freeCourt) {
        return unchanged(state, "no_free_court", "All courts are in use.");
      }

      const others = waiting.filter((player) => player.id !== requester.id);
      const picked = pickRandomItems(others, required - 1, random);
      const selectedIds = new Set([requester.id, ...picked.map((player) => player.id)]);

      return changed(
        {
          ...state,
          players: state.players.map((player) =>
            selectedIds.has(player.id)
              ? {
                  ...player,
                  status: "on_court" as const,
                  courtId: freeCourt.id,
                }
              : player,
          ),
        },
        `Playing on ${freeCourt.name}.`,
        { selectedPlayerIds: [...selectedIds], courtId: freeCourt.id },
      );
    }

    case "END_MATCH": {
      const player = findPlayer(state, action.playerId);
      if (!player) {
        return unchanged(state, "player_not_found", "That player is not in the pool.");
      }
      if (player.status !== "on_court" || !player.courtId) {
        return unchanged(state, "not_on_court", "You are not on a court.");
      }

      const court = findCourt(state, player.courtId);
      return changed(
        returnCourtToWaiting(state, player.courtId, now),
        court ? `${court.name} is free again.` : "Players returned to waiting.",
        { courtId: player.courtId },
      );
    }

    case "CLEAR_COURT": {
      const court = findCourt(state, action.courtId);
      if (!court) {
        return unchanged(state, "court_not_found", "That court does not exist.");
      }
      if (getCourtPlayers(state, court.id).length === 0) {
        return unchanged(state);
      }
      return changed(
        returnCourtToWaiting(state, court.id, now),
        `${court.name} is free again.`,
        { courtId: court.id },
      );
    }

    case "LEAVE":
    case "REMOVE_PLAYER": {
      const player = findPlayer(state, action.playerId);
      if (!player) {
        return unchanged(state, "player_not_found", "That player is not in the pool.");
      }
      return changed(
        {
          ...state,
          players: state.players.filter((current) => current.id !== player.id),
        },
        `${player.name} left the pool.`,
      );
    }

    case "RENAME_PLAYER": {
      const player = findPlayer(state, action.playerId);
      if (!player) {
        return unchanged(state, "player_not_found", "That player is not in the pool.");
      }
      const name = normalizeDisplayName(action.name);
      if (!name) {
        return unchanged(state, "empty_name", "Enter a player name.");
      }
      const nameKey = toNameKey(name);
      const taken = findPlayerByNameKey(state, nameKey);
      if (taken && taken.id !== player.id) {
        return unchanged(
          state,
          "name_taken",
          "That name is already in the pool. Pick a different name.",
        );
      }
      if (player.name === name) {
        return unchanged(state);
      }
      return changed(
        {
          ...state,
          players: state.players.map((current) =>
            current.id === player.id ? { ...current, name, nameKey } : current,
          ),
        },
        `Renamed to ${name}.`,
      );
    }

    case "RENAME_COURT": {
      const court = findCourt(state, action.courtId);
      if (!court) {
        return unchanged(state, "court_not_found", "That court does not exist.");
      }
      const name = normalizeDisplayName(action.name);
      if (!name) {
        return unchanged(state, "empty_name", "Enter a court name.");
      }
      const nameKey = toNameKey(name);
      const taken = state.courts.some(
        (current) => current.id !== court.id && current.nameKey === nameKey,
      );
      if (taken) {
        return unchanged(state, "court_name_taken", "That court name is already used.");
      }
      if (court.name === name) {
        return unchanged(state);
      }
      return changed(
        {
          ...state,
          courts: state.courts.map((current) =>
            current.id === court.id ? { ...current, name, nameKey } : current,
          ),
        },
        `Court renamed to ${name}.`,
      );
    }

    case "UPDATE_SETTINGS": {
      let next: SessionState = state;
      if (action.gameMode && action.gameMode !== state.settings.gameMode) {
        next = {
          ...next,
          settings: { ...next.settings, gameMode: action.gameMode },
        };
      }
      if (
        action.courtCount !== undefined &&
        action.courtCount !== next.courts.length
      ) {
        const synced = syncCourtCount(next, action.courtCount, createId);
        if (typeof synced === "string") {
          return unchanged(
            state,
            synced,
            synced === "occupied_court"
              ? "Cannot remove a court that still has players."
              : "Choose between 1 and 8 courts.",
          );
        }
        next = synced;
      } else if (action.courtCount !== undefined) {
        next = {
          ...next,
          settings: { ...next.settings, courtCount: action.courtCount },
        };
      }

      if (next === state) {
        return unchanged(state);
      }
      return changed(next, "Settings saved.");
    }

    case "RESET_SESSION":
      if (state.players.length === 0) {
        return unchanged(state);
      }
      return changed({ ...state, players: [] }, "Session reset. Everyone is out of the pool.");

    default:
      return unchanged(state);
  }
}
