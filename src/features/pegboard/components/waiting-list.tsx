"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import type { DragOrigin } from "../drag/player-drag";
import type { Player } from "../model/board";
import { PlayerTile } from "./player-tile";

export function WaitingList({
  players,
  selectedPlayerId,
  disabled,
  dropActive,
  draggingPlayerId,
  onSelect,
  onRename,
  onDelete,
  onDragStart,
}: {
  players: Player[];
  selectedPlayerId: string | null;
  disabled: boolean;
  dropActive: boolean;
  draggingPlayerId: string | null;
  onSelect: (playerId: string) => void;
  onRename: (playerId: string, currentName: string) => void;
  onDelete: (playerId: string, currentName: string) => void;
  onDragStart: (
    event: ReactPointerEvent,
    player: { id: string; name: string; origin: DragOrigin },
  ) => void;
}) {
  return (
    <section
      className={`zone waiting-zone${dropActive ? " is-drop-target" : ""}`}
      aria-labelledby="waiting-heading"
      data-pegboard-drop="waiting"
    >
      <div className="zone-header">
        <h2 id="waiting-heading">Waiting</h2>
        <p className="zone-count">{players.length}</p>
      </div>
      {players.length === 0 ? (
        <p className="empty-copy">Drop a court player here, or add a new player.</p>
      ) : (
        <ul className="player-list">
          {players.map((player) => (
            <li key={player.id}>
              <PlayerTile
                mode="waiting"
                playerId={player.id}
                name={player.name}
                selected={selectedPlayerId === player.id}
                disabled={disabled}
                dragging={draggingPlayerId === player.id}
                onSelect={() => onSelect(player.id)}
                onRename={() => onRename(player.id, player.name)}
                onDelete={() => onDelete(player.id, player.name)}
                onDragStart={onDragStart}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
