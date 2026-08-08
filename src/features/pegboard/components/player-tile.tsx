"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { TennisBall } from "../graphics/tennis-ball";
import type { DragOrigin } from "../drag/player-drag";

export function PlayerTile({
  playerId,
  name,
  selected = false,
  onSelect,
  onReturn,
  onRename,
  onDelete,
  onDragStart,
  disabled = false,
  dragging = false,
  mode,
}: {
  playerId: string;
  name: string;
  selected?: boolean;
  onSelect?: () => void;
  onReturn?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onDragStart?: (
    event: ReactPointerEvent,
    player: { id: string; name: string; origin: DragOrigin },
  ) => void;
  disabled?: boolean;
  dragging?: boolean;
  mode: "waiting" | "court";
}) {
  function handlePointerDown(event: ReactPointerEvent) {
    onDragStart?.(event, {
      id: playerId,
      name,
      origin: mode,
    });
  }

  if (mode === "waiting") {
    return (
      <div
        className={`player-tile${selected ? " is-selected" : ""}${
          dragging ? " is-dragging" : ""
        }`}
      >
        <button
          type="button"
          className="player-main"
          onClick={onSelect}
          onPointerDown={handlePointerDown}
          disabled={disabled}
          aria-pressed={selected}
          aria-label={
            selected
              ? `${name}, selected. Drag onto a court, or tap a court to place.`
              : `Drag ${name} onto a court, or tap to select`
          }
        >
          <TennisBall className="player-ball" />
          <span className="player-name">{name}</span>
          <span className="player-hint">Drag to court</span>
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
    <div className={`player-tile court-player${dragging ? " is-dragging" : ""}`}>
      <button
        type="button"
        className="player-main"
        onClick={onReturn}
        onPointerDown={handlePointerDown}
        disabled={disabled}
        aria-label={`Drag ${name} back to Waiting, or tap to return`}
      >
        <TennisBall className="player-ball" />
        <span className="player-name">{name}</span>
        <span className="player-hint">Drag to Waiting</span>
      </button>
    </div>
  );
}
