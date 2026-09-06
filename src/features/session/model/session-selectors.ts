import {
  requiredPlayers,
  type SessionCourt,
  type SessionPlayer,
  type SessionState,
} from "./session";

export function findPlayer(
  state: SessionState,
  playerId: string,
): SessionPlayer | undefined {
  return state.players.find((player) => player.id === playerId);
}

export function findPlayerByToken(
  state: SessionState,
  token: string,
): SessionPlayer | undefined {
  return state.players.find((player) => player.token === token);
}

export function findPlayerByNameKey(
  state: SessionState,
  nameKey: string,
): SessionPlayer | undefined {
  return state.players.find((player) => player.nameKey === nameKey);
}

export function findCourt(
  state: SessionState,
  courtId: string,
): SessionCourt | undefined {
  return state.courts.find((court) => court.id === courtId);
}

export function getWaitingPlayers(state: SessionState): SessionPlayer[] {
  return state.players
    .filter((player) => player.status === "waiting")
    .slice()
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}

export function getCourtPlayers(
  state: SessionState,
  courtId: string,
): SessionPlayer[] {
  return state.players
    .filter((player) => player.courtId === courtId)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function isCourtOccupied(state: SessionState, courtId: string): boolean {
  return state.players.some((player) => player.courtId === courtId);
}

export function getFreeCourts(state: SessionState): SessionCourt[] {
  return state.courts
    .filter((court) => !isCourtOccupied(state, court.id))
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getOccupiedCourtCount(state: SessionState): number {
  return state.courts.filter((court) => isCourtOccupied(state, court.id)).length;
}

export type StartBlockReason = "need_players" | "no_free_court" | null;

export function getStartAvailability(state: SessionState): {
  required: number;
  waitingCount: number;
  freeCourtCount: number;
  playersNeeded: number;
  canStart: boolean;
  startBlockedReason: StartBlockReason;
} {
  const required = requiredPlayers(state.settings.gameMode);
  const waitingCount = getWaitingPlayers(state).length;
  const freeCourtCount = getFreeCourts(state).length;
  const playersNeeded = Math.max(0, required - waitingCount);
  const canStart = waitingCount >= required && freeCourtCount > 0;
  let startBlockedReason: StartBlockReason = null;
  if (!canStart) {
    startBlockedReason =
      waitingCount >= required && freeCourtCount === 0
        ? "no_free_court"
        : "need_players";
  }

  return {
    required,
    waitingCount,
    freeCourtCount,
    playersNeeded,
    canStart,
    startBlockedReason,
  };
}

export function pickRandomItems<T>(
  items: readonly T[],
  count: number,
  random: () => number,
): T[] {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const current = copy[index]!;
    copy[index] = copy[swapWith]!;
    copy[swapWith] = current;
  }
  return copy.slice(0, count);
}
