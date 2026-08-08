"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import type { DragOrigin } from "../drag/player-drag";
import type { CourtId, Player } from "../model/board";
import { PlayerTile } from "./player-tile";

export function CourtCard({
  courtId,
  players,
  isIncomplete,
  isFull,
  disabled,
  canReceive,
  dropActive,
  draggingPlayerId,
  onAssign,
  onReturn,
  onDragStart,
}: {
  courtId: CourtId;
  players: Player[];
  isIncomplete: boolean;
  isFull: boolean;
  disabled: boolean;
  canReceive: boolean;
  dropActive: boolean;
  draggingPlayerId: string | null;
  onAssign: (courtId: CourtId) => void;
  onReturn: (playerId: string) => void;
  onDragStart: (
    event: ReactPointerEvent,
    player: { id: string; name: string; origin: DragOrigin },
  ) => void;
}) {
  return (
    <section
      className={`zone court-zone${isIncomplete ? " is-incomplete" : ""}${
        isFull ? " is-full" : ""
      }${canReceive || dropActive ? " can-receive" : ""}${
        dropActive ? " is-drop-target" : ""
      }`}
      aria-labelledby={`court-${courtId}-heading`}
      data-pegboard-drop={String(courtId)}
    >
      <div className="zone-header">
        <h2 id={`court-${courtId}-heading`}>Court {courtId}</h2>
        <p className="zone-count">{players.length}/4</p>
      </div>

      {isIncomplete ? (
        <p className="status-pill warning" role="status">
          Needs player
        </p>
      ) : null}

      {isFull ? (
        <p className="status-pill muted" role="status">
          Full
        </p>
      ) : null}

      <button
        type="button"
        className="court-target"
        onClick={() => onAssign(courtId)}
        disabled={disabled}
        aria-label={
          isFull
            ? `Court ${courtId} is full`
            : `Place selected player on Court ${courtId}`
        }
      >
        {isFull ? "Court full" : "Place here"}
      </button>

      {players.length === 0 ? (
        <p className="empty-copy">Drag a waiting player onto this court.</p>
      ) : (
        <ul className="player-list court-players">
          {players.map((player) => (
            <li key={player.id}>
              <PlayerTile
                mode="court"
                playerId={player.id}
                name={player.name}
                disabled={disabled}
                dragging={draggingPlayerId === player.id}
                onReturn={() => onReturn(player.id)}
                onDragStart={onDragStart}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
