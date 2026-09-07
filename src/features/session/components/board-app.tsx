"use client";

import { useState } from "react";
import { PlayerManager } from "@/features/pegboard/components/player-manager";
import { TextSizeControl } from "@/features/pegboard/components/text-size-control";
import { TennisBall } from "@/features/pegboard/graphics/tennis-ball";
import { useTextSize } from "@/features/pegboard/hooks/use-text-size";
import { createPlayerIdentity } from "../identity/player-identity";
import { useSession } from "../hooks/use-session";
import { readyButtonLabel } from "../model/session-copy";
import { SessionCourtCard } from "./session-court-card";
import { SessionTicker } from "./session-ticker";
import { SessionWaitingList } from "./session-waiting-list";

export function BoardApp() {
  const session = useSession(null);
  const { textSize, setTextSize } = useTextSize();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const view = session.view;
  const canInteract = Boolean(view) && !session.loading && !busy;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  function handleAdd(name: string) {
    const next = createPlayerIdentity(name);
    void run(() => session.join(next.token, name));
  }

  function handleRename(playerId: string, currentName: string) {
    const next = window.prompt("Rename player", currentName);
    if (next === null) {
      return;
    }
    void run(() => session.renamePlayer(playerId, next));
  }

  function handleRemove(playerId: string, currentName: string) {
    if (!window.confirm(`Remove ${currentName} from the pool?`)) {
      return;
    }
    void run(() => session.removePlayer(playerId));
  }

  function handleReset() {
    if (
      !window.confirm(
        "Reset the session? Everyone leaves the pool and courts go empty.",
      )
    ) {
      return;
    }
    void run(() => session.reset());
  }

  async function handleReady() {
    setBusy(true);
    try {
      await session.ready();
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pegboard-shell">
      <header className="app-header">
        <div className="header-brand-block">
          <div className="brand">
            <TennisBall className="brand-ball" />
            <div>
              <p className="scoreboard-label">Club session</p>
              <h1>Tennis Court Board</h1>
            </div>
          </div>
          <div className="header-tools">
            <a className="chip-button" href="/settings">
              Settings
            </a>
            <a className="chip-button" href="/play">
              Player app
            </a>
            <TextSizeControl textSize={textSize} onChange={setTextSize} />
          </div>
        </div>
        <PlayerManager disabled={!canInteract} onAdd={handleAdd} />
      </header>

      <div className="status-bar">
        <div className="selection-panel" role="status" aria-live="polite">
          <TennisBall className="status-ball" />
          <div>
            <p className="scoreboard-label">Session</p>
            <p className="selection-value">
              {session.loading && !view
                ? "Loading…"
                : view
                  ? `${view.waitingCount} waiting · ${view.freeCourtCount} free`
                  : "Could not load the session"}
            </p>
          </div>
        </div>
        <div className="notice-panel" role="status" aria-live="polite">
          <p className="scoreboard-label">Board status</p>
          <p className="selection-value">{session.notice ?? "Ready"}</p>
        </div>
        <button
          type="button"
          className="chip-button danger"
          onClick={handleReset}
          disabled={!canInteract}
        >
          Reset session
        </button>
      </div>

      <div className="board-stage">
        <div className="board-grid">
          <SessionWaitingList
            players={view?.waiting ?? []}
            disabled={!canInteract}
            onRename={handleRename}
            onRemove={handleRemove}
          />
          <div className="courts-column" aria-label="On Court">
            <div className="on-court-heading">
              <h2>On Court</h2>
              <p>Players ready fills one free court from the waiting pool</p>
            </div>
            <div className="courts-grid">
              {(view?.courts ?? []).map((court) => (
                <SessionCourtCard
                  key={court.id}
                  court={court}
                  disabled={!canInteract}
                  onClear={(courtId) =>
                    void run(() => session.done({ courtId }))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="play-dock board-dock">
        {confirming ? (
          <div className="play-dock-stack">
            <p className="play-lede">
              Start a court with the longest-waiting players?
            </p>
            <div className="play-button-row">
              <button
                type="button"
                className="play-primary"
                disabled={busy}
                onClick={() => void handleReady()}
              >
                Yes, players ready
              </button>
              <button
                type="button"
                className="play-secondary"
                disabled={busy}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="play-primary"
            disabled={!canInteract || !view?.canStart}
            onClick={() => setConfirming(true)}
          >
            {view ? readyButtonLabel(view) : "Players ready"}
          </button>
        )}
      </div>

      {view ? <SessionTicker view={view} /> : null}
    </div>
  );
}
