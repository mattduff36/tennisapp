import { TennisBall } from "@/features/pegboard/graphics/tennis-ball";
import type { SessionWaitingPerson } from "../model/session-view";

export function SessionWaitingList({
  players,
  disabled,
  onRename,
  onRemove,
}: {
  players: SessionWaitingPerson[];
  disabled: boolean;
  onRename: (playerId: string, currentName: string) => void;
  onRemove: (playerId: string, currentName: string) => void;
}) {
  return (
    <section className="zone waiting-zone" aria-labelledby="waiting-heading">
      <div className="zone-header">
        <h2 id="waiting-heading">Waiting</h2>
        <p className="zone-count">{players.length}</p>
      </div>
      {players.length === 0 ? (
        <p className="empty-copy">Add a player, or wait for phones to join.</p>
      ) : (
        <ul className="player-list">
          {players.map((player) => (
            <li key={player.id}>
              <div className="player-tile">
                <div className="player-main">
                  <TennisBall className="player-ball" />
                  <span className="player-name">{player.name}</span>
                  <span className="player-hint">Waiting {player.waitLabel}</span>
                </div>
                <div className="player-actions">
                  <button
                    type="button"
                    className="chip-button"
                    disabled={disabled}
                    onClick={() => onRename(player.id, player.name)}
                    aria-label={`Rename ${player.name}`}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="chip-button danger"
                    disabled={disabled}
                    onClick={() => onRemove(player.id, player.name)}
                    aria-label={`Remove ${player.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
