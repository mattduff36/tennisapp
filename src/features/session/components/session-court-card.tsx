import { TennisBall } from "@/features/pegboard/graphics/tennis-ball";
import type { SessionCourtView } from "../model/session-view";

export function SessionCourtCard({
  court,
  disabled,
  onClear,
}: {
  court: SessionCourtView;
  disabled: boolean;
  onClear: (courtId: string) => void;
}) {
  return (
    <section
      className={`zone court-zone${court.occupied ? " is-full" : ""}`}
      aria-labelledby={`court-${court.id}-heading`}
    >
      <div className="zone-header">
        <h2 id={`court-${court.id}-heading`}>{court.name}</h2>
        <p className="zone-count">
          {court.occupied ? court.durationLabel ?? "In play" : "Free"}
        </p>
      </div>

      {court.occupied ? (
        <>
          <ul className="player-list court-players">
            {court.players.map((player) => (
              <li key={player.id}>
                <div className="player-tile court-player">
                  <div className="player-main">
                    <TennisBall className="player-ball" />
                    <span className="player-name">{player.name}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="chip-button"
            disabled={disabled}
            onClick={() => onClear(court.id)}
          >
            Clear court
          </button>
        </>
      ) : (
        <p className="empty-copy">
          Free — tap Players ready when enough people are waiting.
        </p>
      )}
    </section>
  );
}
