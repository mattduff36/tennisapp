import {
  COURT_CAPACITY,
  COURT_IDS,
  type BoardState,
  type CourtId,
  type Player,
} from "./board";

export function getWaitingPlayers(state: BoardState): Player[] {
  return state.players.filter((player) => player.location.kind === "waiting");
}

export function getCourtPlayers(state: BoardState, courtId: CourtId): Player[] {
  return state.players.filter(
    (player) =>
      player.location.kind === "court" && player.location.courtId === courtId,
  );
}

export function getCourtOccupancy(state: BoardState, courtId: CourtId): number {
  return getCourtPlayers(state, courtId).length;
}

export function isCourtFull(state: BoardState, courtId: CourtId): boolean {
  return getCourtOccupancy(state, courtId) >= COURT_CAPACITY;
}

export function isCourtIncomplete(state: BoardState, courtId: CourtId): boolean {
  return getCourtOccupancy(state, courtId) === 1;
}

export function findPlayer(state: BoardState, playerId: string): Player | undefined {
  return state.players.find((player) => player.id === playerId);
}

export function getCourtsSummary(state: BoardState) {
  return COURT_IDS.map((courtId) => ({
    courtId,
    players: getCourtPlayers(state, courtId),
    occupancy: getCourtOccupancy(state, courtId),
    isFull: isCourtFull(state, courtId),
    isIncomplete: isCourtIncomplete(state, courtId),
  }));
}

export function everyPlayerHasOneLocation(state: BoardState): boolean {
  const ids = new Set<string>();

  for (const player of state.players) {
    if (ids.has(player.id)) {
      return false;
    }
    ids.add(player.id);

    if (player.location.kind === "waiting") {
      continue;
    }

    if (
      player.location.kind !== "court" ||
      ![1, 2, 3].includes(player.location.courtId)
    ) {
      return false;
    }
  }

  return COURT_IDS.every(
    (courtId) => getCourtOccupancy(state, courtId) <= COURT_CAPACITY,
  );
}
