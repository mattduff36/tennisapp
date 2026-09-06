import { isGameMode, type GameMode } from "../model/session";
import { findPlayerByToken } from "../model/session-selectors";
import { reduceSession, type SessionAction } from "../model/session-reducer";
import { toSessionView, type SessionView } from "../model/session-view";
import type { SessionRepository } from "../storage/session-repository";
import {
  isRecord,
  readOptionalString,
  readString,
  statusForSessionError,
  type SessionHttpResult,
} from "./session-http";

export type SessionMutationBody = SessionView & {
  notice: string | null;
  error: string | null;
};

function applyAction(
  repository: SessionRepository,
  action: SessionAction,
  token: string | null,
): Promise<SessionHttpResult<SessionMutationBody>> {
  return repository.transact<SessionHttpResult<SessionMutationBody>>((state) => {
    const result = reduceSession(state, action);
    if (result.error) {
      return {
        next: state,
        changed: false,
        value: {
          status: statusForSessionError(result.error),
          body: {
            ...toSessionView(state, token),
            notice: result.notice,
            error: result.error,
          },
        },
      };
    }

    return {
      next: result.state,
      changed: result.changed,
      value: {
        status: 200,
        body: {
          ...toSessionView(result.state, token),
          notice: result.notice,
          error: null,
        },
      },
    };
  });
}

function applyForToken(
  repository: SessionRepository,
  token: string,
  actionFor: (playerId: string) => SessionAction,
): Promise<SessionHttpResult<SessionMutationBody>> {
  return repository.transact<SessionHttpResult<SessionMutationBody>>((state) => {
    const player = findPlayerByToken(state, token);
    if (!player) {
      return {
        next: state,
        changed: false,
        value: {
          status: 404,
          body: {
            ...toSessionView(state, token),
            notice: "You are not in the pool.",
            error: "player_not_found",
          },
        },
      };
    }
    const result = reduceSession(state, actionFor(player.id));
    if (result.error) {
      return {
        next: state,
        changed: false,
        value: {
          status: statusForSessionError(result.error),
          body: {
            ...toSessionView(state, token),
            notice: result.notice,
            error: result.error,
          },
        },
      };
    }
    return {
      next: result.state,
      changed: result.changed,
      value: {
        status: 200,
        body: {
          ...toSessionView(result.state, token),
          notice: result.notice,
          error: null,
        },
      },
    };
  });
}

export async function handleGetSession(
  repository: SessionRepository,
  token: string | null,
): Promise<SessionHttpResult<SessionView>> {
  const state = await repository.load();
  return { status: 200, body: toSessionView(state, token) };
}

export async function handleJoinSession(
  repository: SessionRepository,
  payload: unknown,
): Promise<SessionHttpResult<SessionMutationBody | { error: string; notice: string }>> {
  if (!isRecord(payload)) {
    return { status: 400, body: { error: "invalid_body", notice: "Send a name and token." } };
  }
  const token = readString(payload.token);
  const name = readString(payload.name);
  if (!token || !name) {
    return { status: 400, body: { error: "invalid_body", notice: "Send a name and token." } };
  }
  return applyAction(repository, { type: "JOIN", token, name }, token);
}

export async function handleReadySession(
  repository: SessionRepository,
  payload: unknown,
): Promise<SessionHttpResult<SessionMutationBody | { error: string; notice: string }>> {
  if (!isRecord(payload)) {
    return { status: 400, body: { error: "invalid_body", notice: "Missing player." } };
  }
  const token = readString(payload.token);
  if (!token) {
    return { status: 400, body: { error: "invalid_body", notice: "Missing player." } };
  }
  return applyForToken(repository, token, (playerId) => ({
    type: "START_MATCH",
    playerId,
  }));
}

export async function handleDoneSession(
  repository: SessionRepository,
  payload: unknown,
): Promise<SessionHttpResult<SessionMutationBody | { error: string; notice: string }>> {
  if (!isRecord(payload)) {
    return { status: 400, body: { error: "invalid_body", notice: "Missing player or court." } };
  }
  const token = readOptionalString(payload.token);
  const courtId = readOptionalString(payload.courtId);
  if (courtId) {
    return applyAction(repository, { type: "CLEAR_COURT", courtId }, token ?? null);
  }
  if (!token) {
    return { status: 400, body: { error: "invalid_body", notice: "Missing player or court." } };
  }
  return applyForToken(repository, token, (playerId) => ({
    type: "END_MATCH",
    playerId,
  }));
}

export async function handleLeaveSession(
  repository: SessionRepository,
  payload: unknown,
): Promise<SessionHttpResult<SessionMutationBody | { error: string; notice: string }>> {
  if (!isRecord(payload)) {
    return { status: 400, body: { error: "invalid_body", notice: "Missing player." } };
  }
  const token = readString(payload.token);
  if (!token) {
    return { status: 400, body: { error: "invalid_body", notice: "Missing player." } };
  }
  return applyForToken(repository, token, (playerId) => ({
    type: "LEAVE",
    playerId,
  }));
}

export async function handleResetSession(
  repository: SessionRepository,
): Promise<SessionHttpResult<SessionMutationBody>> {
  return applyAction(repository, { type: "RESET_SESSION" }, null);
}

export async function handlePatchSettings(
  repository: SessionRepository,
  payload: unknown,
): Promise<SessionHttpResult<SessionMutationBody | { error: string; notice: string }>> {
  if (!isRecord(payload)) {
    return { status: 400, body: { error: "invalid_body", notice: "Invalid settings." } };
  }

  return repository.transact<
    SessionHttpResult<SessionMutationBody | { error: string; notice: string }>
  >((state) => {
    let current = state;
    let notice: string | null = null;

    const gameMode = payload.gameMode;
    const courtCount = payload.courtCount;
    if (gameMode !== undefined && !isGameMode(gameMode)) {
      return {
        next: state,
        changed: false,
        value: {
          status: 400,
          body: { error: "invalid_settings", notice: "Choose singles or doubles." },
        },
      };
    }
    if (courtCount !== undefined && typeof courtCount !== "number") {
      return {
        next: state,
        changed: false,
        value: {
          status: 400,
          body: { error: "invalid_settings", notice: "Choose between 1 and 8 courts." },
        },
      };
    }

    if (gameMode !== undefined || courtCount !== undefined) {
      const result = reduceSession(current, {
        type: "UPDATE_SETTINGS",
        gameMode: gameMode as GameMode | undefined,
        courtCount: courtCount as number | undefined,
      });
      if (result.error) {
        return {
          next: state,
          changed: false,
          value: {
            status: statusForSessionError(result.error),
            body: {
              ...toSessionView(state, null),
              notice: result.notice,
              error: result.error,
            },
          },
        };
      }
      current = result.state;
      notice = result.notice;
    }

    const courts = payload.courts;
    if (Array.isArray(courts)) {
      for (const court of courts) {
        if (!isRecord(court)) {
          continue;
        }
        const courtId = readString(court.id);
        const name = readString(court.name);
        if (!courtId || !name) {
          continue;
        }
        const result = reduceSession(current, {
          type: "RENAME_COURT",
          courtId,
          name,
        });
        if (result.error) {
          return {
            next: state,
            changed: false,
            value: {
              status: statusForSessionError(result.error),
              body: {
                ...toSessionView(state, null),
                notice: result.notice,
                error: result.error,
              },
            },
          };
        }
        current = result.state;
        notice = result.notice ?? notice;
      }
    }

    return {
      next: current,
      changed: current !== state,
      value: {
        status: 200,
        body: {
          ...toSessionView(current, null),
          notice,
          error: null,
        },
      },
    };
  });
}

export async function handleRenamePlayer(
  repository: SessionRepository,
  payload: unknown,
): Promise<SessionHttpResult<SessionMutationBody | { error: string; notice: string }>> {
  if (!isRecord(payload)) {
    return { status: 400, body: { error: "invalid_body", notice: "Missing player." } };
  }
  const playerId = readString(payload.playerId);
  const name = readString(payload.name);
  if (!playerId || !name) {
    return { status: 400, body: { error: "invalid_body", notice: "Send a player and a name." } };
  }
  return applyAction(repository, { type: "RENAME_PLAYER", playerId, name }, playerId);
}

export async function handleRemovePlayer(
  repository: SessionRepository,
  payload: unknown,
): Promise<SessionHttpResult<SessionMutationBody | { error: string; notice: string }>> {
  if (!isRecord(payload)) {
    return { status: 400, body: { error: "invalid_body", notice: "Missing player." } };
  }
  const playerId = readString(payload.playerId);
  if (!playerId) {
    return { status: 400, body: { error: "invalid_body", notice: "Missing player." } };
  }
  return applyAction(repository, { type: "REMOVE_PLAYER", playerId }, playerId);
}
