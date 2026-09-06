"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionMutationBody } from "../api/session-handlers";
import { clearPlayerIdentity } from "../identity/player-identity";
import type { SessionView } from "../model/session-view";

const POLL_MS = 3000;

type MutationResult = {
  ok: boolean;
  body: SessionMutationBody | { error: string; notice: string };
};

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return { error: "server_error", notice: "The server did not respond." };
  }
}

function isView(value: unknown): value is SessionView {
  return (
    typeof value === "object" &&
    value !== null &&
    "waiting" in value &&
    "courts" in value
  );
}

export function useSession(token: string | null) {
  const [view, setView] = useState<SessionView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyBody = useCallback((body: unknown) => {
    if (isView(body)) {
      setView(body);
    }
    if (typeof body === "object" && body !== null && "notice" in body) {
      const nextNotice = (body as { notice?: string | null }).notice;
      if (typeof nextNotice === "string") {
        setNotice(nextNotice);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    const url = token
      ? `/api/session?token=${encodeURIComponent(token)}`
      : "/api/session";
    try {
      const response = await fetch(url, { cache: "no-store" });
      const body = await readJson(response);
      applyBody(body);
      if (isView(body) && body.playerMissing) {
        clearPlayerIdentity();
        setNotice("That name is no longer in the pool. Join again.");
      }
      if (!response.ok && !isView(body)) {
        const fallback =
          typeof body === "object" && body !== null && "notice" in body
            ? String((body as { notice: string }).notice)
            : "Could not load the session.";
        setNotice(fallback);
      }
    } catch {
      setNotice("Could not load the session.");
    } finally {
      setLoading(false);
    }
  }, [applyBody, token]);

  useEffect(() => {
    const immediate = window.setTimeout(() => {
      void refresh();
    }, 0);
    const timer = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const mutate = useCallback(
    async (path: string, init: RequestInit): Promise<MutationResult> => {
      const response = await fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...init.headers,
        },
      });
      const body = (await readJson(response)) as MutationResult["body"];
      applyBody(body);
      return { ok: response.ok, body };
    },
    [applyBody],
  );

  return {
    view,
    notice,
    loading,
    setNotice,
    refresh,
    join: (token: string, name: string) =>
      mutate("/api/session/join", {
        method: "POST",
        body: JSON.stringify({ token, name }),
      }),
    ready: (token: string) =>
      mutate("/api/session/ready", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    done: (payload: { token?: string; courtId?: string }) =>
      mutate("/api/session/done", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    leave: (token: string) =>
      mutate("/api/session/leave", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    reset: () => mutate("/api/session/reset", { method: "POST" }),
    saveSettings: (payload: unknown) =>
      mutate("/api/session/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    renamePlayer: (playerIdToRename: string, name: string) =>
      mutate("/api/session/player", {
        method: "PATCH",
        body: JSON.stringify({ playerId: playerIdToRename, name }),
      }),
    removePlayer: (playerIdToRemove: string) =>
      mutate("/api/session/player", {
        method: "DELETE",
        body: JSON.stringify({ playerId: playerIdToRemove }),
      }),
  };
}
