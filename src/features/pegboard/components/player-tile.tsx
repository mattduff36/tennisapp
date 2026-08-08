"use client";

import { TennisBall } from "../graphics/tennis-ball";

export function PlayerTile({
  name,
  selected = false,
  onSelect,
  onReturn,
  onRename,
  onDelete,
  disabled = false,
  mode,
}: {
  name: string;
  selected?: boolean;
  onSelect?: () => void;
  onReturn?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  mode: "waiting" | "court";
}) {
  if (mode === "waiting") {
    return (
      <div className={`player-tile${selected ? " is-selected" : ""}`}>
        <button
          type="button"
          className="player-main"
          onClick={onSelect}
          disabled={disabled}
          aria-pressed={selected}
          aria-label={
            selected
              ? `${name}, selected. Tap a court to place, or tap again to clear.`
              : `Select ${name} from Waiting`
          }
        >
          <TennisBall className="player-ball" />
          <span className="player-name">{name}</span>
        </button>
        <div className="player-actions">
          <button
            type="button"
            className="chip-button"
            onClick={onRename}
            disabled={disabled}
            aria-label={`Rename ${name}`}
          >
            Rename
          </button>
          <button
            type="button"
            className="chip-button danger"
            onClick={onDelete}
            disabled={disabled}
            aria-label={`Delete ${name}`}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-tile court-player">
      <button
        type="button"
        className="player-main"
        onClick={onReturn}
        disabled={disabled}
        aria-label={`Return ${name} to Waiting`}
      >
        <TennisBall className="player-ball" />
        <span className="player-name">{name}</span>
        <span className="player-hint">Tap to Waiting</span>
      </button>
    </div>
  );
}
