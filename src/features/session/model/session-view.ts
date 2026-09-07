import { formatDuration } from "@/lib/format-duration";
import type { GameMode, PlayerStatus, ReadyRule } from "./session";
import type { SessionState } from "./session";
import {
  findCourt,
  findPlayerByToken,
  getCourtPlayers,
  getStartAvailability,
  getWaitingPlayers,
} from "./session-selectors";

export type SessionPerson = {
  id: string;
  name: string;
};

export type SessionWaitingPerson = SessionPerson & {
  joinedAt: string;
  waitLabel: string;
};

export type SessionCourtView = {
  id: string;
  name: string;
  sortOrder: number;
  occupied: boolean;
  startedAt: string | null;
  durationLabel: string | null;
  players: SessionPerson[];
};

export type SessionMeView = {
  id: string;
  name: string;
  status: PlayerStatus;
  courtId: string | null;
  courtName: string | null;
  partners: SessionPerson[];
};

export type PinAccess = {
  enabled: boolean;
  unlocked: boolean;
};

export type SessionView = {
  settings: {
    courtCount: number;
    gameMode: GameMode;
    readyRule: ReadyRule;
    pinEnabled: boolean;
    unlocked: boolean;
  };
  courts: SessionCourtView[];
  waiting: SessionWaitingPerson[];
  requiredPlayers: number;
  waitingCount: number;
  freeCourtCount: number;
  playersNeeded: number;
  canStart: boolean;
  startBlockedReason: "need_players" | "no_free_court" | null;
  me: SessionMeView | null;
  playerMissing: boolean;
};

export function isSessionEmpty(view: {
  waiting: readonly unknown[];
  courts: readonly { occupied: boolean }[];
}): boolean {
  return view.waiting.length === 0 && view.courts.every((court) => !court.occupied);
}

export function toSessionView(
  state: SessionState,
  token: string | null,
  now: Date = new Date(),
  pin: PinAccess = { enabled: false, unlocked: true },
): SessionView {
  const availability = getStartAvailability(state);
  const mePlayer = token ? findPlayerByToken(state, token) : undefined;
  const court = mePlayer?.courtId ? findCourt(state, mePlayer.courtId) : undefined;
  const partners = mePlayer?.courtId
    ? getCourtPlayers(state, mePlayer.courtId)
        .filter((player) => player.id !== mePlayer.id)
        .map((player) => ({ id: player.id, name: player.name }))
    : [];

  return {
    settings: {
      courtCount: state.settings.courtCount,
      gameMode: state.settings.gameMode,
      readyRule: state.settings.readyRule,
      pinEnabled: pin.enabled,
      unlocked: pin.enabled ? pin.unlocked : true,
    },
    courts: state.courts
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => {
        const players = getCourtPlayers(state, item.id).map((player) => ({
          id: player.id,
          name: player.name,
        }));
        const occupied = players.length > 0;
        return {
          id: item.id,
          name: item.name,
          sortOrder: item.sortOrder,
          occupied,
          startedAt: occupied ? item.startedAt : null,
          durationLabel:
            occupied && item.startedAt ? formatDuration(item.startedAt, now) : null,
          players,
        };
      }),
    waiting: getWaitingPlayers(state).map((player) => ({
      id: player.id,
      name: player.name,
      joinedAt: player.joinedAt,
      waitLabel: formatDuration(player.joinedAt, now),
    })),
    requiredPlayers: availability.required,
    waitingCount: availability.waitingCount,
    freeCourtCount: availability.freeCourtCount,
    playersNeeded: availability.playersNeeded,
    canStart: availability.canStart,
    startBlockedReason: availability.startBlockedReason,
    me: mePlayer
      ? {
          id: mePlayer.id,
          name: mePlayer.name,
          status: mePlayer.status,
          courtId: mePlayer.courtId,
          courtName: court?.name ?? null,
          partners,
        }
      : null,
    playerMissing: Boolean(token) && !mePlayer,
  };
}
