import {
  COURT_CAPACITY,
  COURT_IDS,
  type BoardState,
  type CourtId,
  type Player,
} from "./board";
import { getCourtOccupancy, getWaitingPlayers } from "./board-selectors";

export type CourtOccupancyLabel = "Incomplete" | "Full" | "Open";

export function durationMs(
  locationEnteredAt: string,
  now: Date = new Date(),
): number {
  const started = Date.parse(locationEnteredAt);
  if (Number.isNaN(started)) {
    return 0;
  }

  return Math.max(0, now.getTime() - started);
}

/** Compact human duration: `45s`, `12m`, `3h 5m`. */
export function formatDuration(
  locationEnteredAt: string,
  now: Date = new Date(),
): string {
  const totalSeconds = Math.floor(durationMs(locationEnteredAt, now) / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function getCourtOccupancyLabel(
  occupancy: number,
): CourtOccupancyLabel {
  if (occupancy === 1) {
    return "Incomplete";
  }
  if (occupancy >= COURT_CAPACITY) {
    return "Full";
  }
  return "Open";
}

export function getLongestWaitingPlayer(
  state: BoardState,
  now: Date = new Date(),
): Player | null {
  const waiting = getWaitingPlayers(state);
  if (waiting.length === 0) {
    return null;
  }

  return waiting.reduce((longest, player) =>
    durationMs(player.locationEnteredAt, now) >
    durationMs(longest.locationEnteredAt, now)
      ? player
      : longest,
  );
}

export function getWaitingSummary(
  state: BoardState,
  now: Date = new Date(),
): { count: number; longest: Player | null; longestLabel: string } {
  const waiting = getWaitingPlayers(state);
  const longest = getLongestWaitingPlayer(state, now);
  return {
    count: waiting.length,
    longest,
    longestLabel: longest
      ? `${longest.name} ${formatDuration(longest.locationEnteredAt, now)}`
      : "—",
  };
}

export function getCourtOccupancySummary(
  state: BoardState,
  courtId: CourtId,
): { courtId: CourtId; occupancy: number; label: CourtOccupancyLabel; text: string } {
  const occupancy = getCourtOccupancy(state, courtId);
  const label = getCourtOccupancyLabel(occupancy);
  return {
    courtId,
    occupancy,
    label,
    text: `Court ${courtId}: ${occupancy}/${COURT_CAPACITY} ${label}`,
  };
}

export function buildTickerSegments(
  state: BoardState,
  now: Date = new Date(),
): string[] {
  const waiting = getWaitingSummary(state, now);
  const segments: string[] = [
    `Waiting: ${waiting.count} · Longest wait: ${waiting.longestLabel}`,
  ];

  for (const courtId of COURT_IDS) {
    segments.push(getCourtOccupancySummary(state, courtId).text);
  }

  for (const player of state.players) {
    if (player.location.kind === "waiting") {
      segments.push(
        `${player.name} waiting ${formatDuration(player.locationEnteredAt, now)}`,
      );
      continue;
    }

    segments.push(
      `${player.name} Court ${player.location.courtId} · ${formatDuration(player.locationEnteredAt, now)}`,
    );
  }

  return segments;
}
