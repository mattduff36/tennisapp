"use client";

import type { Player } from "../model/board";
import { PlayerTile } from "./player-tile";

export function WaitingList({
  players,
  selectedPlayerId,
  disabled,
  onSelect,
  onRename,
  onDelete,
}: {
  players: Player[];
  selectedPlayerId: string | null;
  disabled: boolean;
  onSelect: (playerId: string) => void;
  onRename: (playerId: string, currentName: string) => void;
  onDelete: (playerId: string, currentName: string) => void;
}) {
  return (
    <section className="zone waiting-zone" aria-labelledby="waiting-heading">
      <div className="zone-header">
        <h2 id="waiting-heading">Waiting</h2>
        <p className="zone-count">{players.length}</p>
      </div>
      {players.length === 0 ? (
        <p className="empty-copy">No one waiting. Add a player to start the board.</p>
      ) : (
        <ul className="player-list">
          {players.map((player) => (
            <li key={player.id}>
              <PlayerTile
                mode="waiting"
                name={player.name}
                selected={selectedPlayerId === player.id}
                disabled={disabled}
                onSelect={() => onSelect(player.id)}
                onRename={() => onRename(player.id, player.name)}
                onDelete={() => onDelete(player.id, player.name)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
