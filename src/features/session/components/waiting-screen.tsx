"use client";

import type { SessionView } from "../model/session-view";

export function WaitingScreen({
  view,
  notice,
  confirming,
  busy,
  onConfirmReady,
  onCancelConfirm,
  onReady,
  onLeave,
}: {
  view: SessionView;
  notice: string | null;
  confirming: boolean;
  busy: boolean;
  onConfirmReady: () => void;
  onCancelConfirm: () => void;
  onReady: () => void;
  onLeave: () => void;
}) {
  const blockedLabel =
    view.startBlockedReason === "no_free_court"
      ? "All courts in use"
      : view.playersNeeded === 1
        ? "Need 1 more"
        : `Need ${view.playersNeeded} more`;

  return (
    <section className="play-card">
      <p className="scoreboard-label">Waiting pool</p>
      <h1 className="play-title">In the pool</h1>
      <p className="play-lede">
        {view.waitingCount} waiting · {view.requiredPlayers} needed for{" "}
        {view.settings.gameMode}
      </p>
      {notice ? <p className="play-notice">{notice}</p> : null}

      <ul className="play-pool">
        {view.waiting.length === 0 ? (
          <li className="play-empty">Nobody is waiting yet.</li>
        ) : (
          view.waiting.map((player) => (
            <li key={player.id}>
              {player.name}
              {view.me?.id === player.id ? " (you)" : ""}
            </li>
          ))
        )}
      </ul>

      {confirming ? (
        <div className="play-confirm">
          <p className="play-lede">Start a court with you plus random players?</p>
          <button
            type="button"
            className="play-primary"
            disabled={busy}
            onClick={onReady}
          >
            Yes, players ready
          </button>
          <button
            type="button"
            className="play-secondary"
            disabled={busy}
            onClick={onCancelConfirm}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="play-primary"
          disabled={busy || !view.canStart}
          onClick={onConfirmReady}
        >
          {view.canStart ? "Players ready" : blockedLabel}
        </button>
      )}

      <button type="button" className="play-secondary" disabled={busy} onClick={onLeave}>
        Leave
      </button>
    </section>
  );
}
