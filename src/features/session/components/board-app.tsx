"use client";

import { useEffect, useState } from "react";
import { PlayerManager } from "@/features/pegboard/components/player-manager";
import { TextSizeControl } from "@/features/pegboard/components/text-size-control";
import { TennisBall } from "@/features/pegboard/graphics/tennis-ball";
import { useTextSize } from "@/features/pegboard/hooks/use-text-size";
import { clearLegacyPegboardStorage } from "../identity/clear-legacy-storage";
import { createPlayerIdentity } from "../identity/player-identity";
import { useSession } from "../hooks/use-session";
import {
  courtDensityForCount,
  readyButtonLabel,
  readyConfirmCopy,
} from "../model/session-copy";
import { PlayDockPair } from "./play-dock";
import { PlayNav } from "./play-nav";
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
  const courtCount = view?.settings.courtCount ?? 0;
  const courtDensity = courtDensityForCount(courtCount);

  useEffect(() => {
    clearLegacyPegboardStorage();
  }, []);

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
    void run(() => session.join(next.token, name, false));
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
    void run(async () => {
      const result = await session.reset();
      const error =
        typeof result.body === "object" && result.body && "error" in result.body
          ? result.body.error
          : null;
      if (error === "pin_required") {
        session.setNotice("Unlock Settings with the club PIN first.");
      }
    });
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
      <PlayNav />
      <div className="pegboard-main">
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
            className="play-danger"
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
              <div
                className="courts-grid"
                data-court-count={courtCount || undefined}
                data-court-density={courtCount ? courtDensity : undefined}
              >
                {(view?.courts ?? []).map((court) => (
                  <SessionCourtCard
                    key={court.id}
                    court={court}
                    density={courtDensity}
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
                {readyConfirmCopy(
                  view?.settings.readyRule ?? "longest_wait",
                  "board",
                )}
              </p>
              <PlayDockPair
                leading={
                  <button
                    type="button"
                    className="play-secondary"
                    disabled={busy}
                    onClick={() => setConfirming(false)}
                  >
                    Cancel
                  </button>
                }
                action={
                  <button
                    type="button"
                    className="play-primary"
                    disabled={busy}
                    onClick={() => void handleReady()}
                  >
                    Yes, players ready
                  </button>
                }
              />
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
    </div>
  );
}
