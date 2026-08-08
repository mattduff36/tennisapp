"use client";

import { CourtMarkings } from "../graphics/court-markings";
import { NetStrip } from "../graphics/net-strip";
import type { CourtId, Player } from "../model/board";
import { PlayerTile } from "./player-tile";

export function CourtCard({
  courtId,
  players,
  isIncomplete,
  isFull,
  disabled,
  canReceive,
  onAssign,
  onReturn,
}: {
  courtId: CourtId;
  players: Player[];
  isIncomplete: boolean;
  isFull: boolean;
  disabled: boolean;
  canReceive: boolean;
  onAssign: (courtId: CourtId) => void;
  onReturn: (playerId: string) => void;
}) {
  return (
    <section
      className={`zone court-zone${isIncomplete ? " is-incomplete" : ""}${
        isFull ? " is-full" : ""
      }${canReceive ? " can-receive" : ""}`}
      aria-labelledby={`court-${courtId}-heading`}
    >
      <div className="zone-header">
        <h2 id={`court-${courtId}-heading`}>Court {courtId}</h2>
        <p className="zone-count">{players.length}/4</p>
      </div>

      <div className="court-artwork" aria-hidden="true">
        <CourtMarkings className="court-lines" />
        <NetStrip className="court-net" />
      </div>

      {isIncomplete ? (
        <p className="status-pill warning" role="status">
          Incomplete — needs another player
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
        <p className="empty-copy">Open court — tap Place here after selecting a player.</p>
      ) : (
        <ul className="player-list court-players">
          {players.map((player) => (
            <li key={player.id}>
              <PlayerTile
                mode="court"
                name={player.name}
                disabled={disabled}
                onReturn={() => onReturn(player.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
