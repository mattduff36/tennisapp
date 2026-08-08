"use client";

import type { PersistenceStatus } from "../hooks/use-pegboard";
import { TennisBall } from "../graphics/tennis-ball";

export function StatusBar({
  selectedPlayerName,
  notice,
  persistenceStatus,
  storageMessage,
  onDismissNotice,
  onReset,
  canInteract,
}: {
  selectedPlayerName: string | null;
  notice: string | null;
  persistenceStatus: PersistenceStatus;
  storageMessage: string | null;
  onDismissNotice: () => void;
  onReset: () => void;
  canInteract: boolean;
}) {
  const persistenceLabel = {
    loading: "Loading board…",
    ready: "Ready",
    saving: "Saving…",
    saved: "Saved on this device",
    "save-failed": "Save failed",
    corrupt: "Local data unreadable",
    unsupported: "Newer board found",
  }[persistenceStatus];

  return (
    <div className="status-bar">
      <div className="selection-panel" role="status" aria-live="polite">
        <TennisBall className="status-ball" />
        <div>
          <p className="scoreboard-label">Selected</p>
          <p className="selection-value">
            {selectedPlayerName ?? "Drag a player, or tap to select"}
          </p>
        </div>
      </div>

      <div className="notice-panel" role="status" aria-live="polite">
        <p className="scoreboard-label">Board status</p>
        <p className="selection-value">{persistenceLabel}</p>
        {notice ? (
          <div className="notice-row">
            <p>{notice}</p>
            <button type="button" className="chip-button" onClick={onDismissNotice}>
              Dismiss
            </button>
          </div>
        ) : null}
        {storageMessage ? <p className="storage-message">{storageMessage}</p> : null}
      </div>

      <button
        type="button"
        className="chip-button danger"
        onClick={onReset}
        disabled={persistenceStatus === "loading"}
        aria-label="Reset local board"
      >
        {canInteract ? "Reset board" : "Reset local board"}
      </button>
    </div>
  );
}
