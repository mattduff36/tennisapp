import type { SessionView } from "../model/session-view";

export function SessionSummary({ view }: { view: SessionView }) {
  return (
    <section className="play-summary" aria-label="Court summary">
      <p className="scoreboard-label">Now</p>
      <p className="play-lede">
        {view.waitingCount} waiting · {view.freeCourtCount} free ·{" "}
        {view.requiredPlayers} for {view.settings.gameMode}
      </p>
      <ul className="play-summary-list">
        {view.courts.map((court) => (
          <li key={court.id}>
            <strong>{court.name}</strong>
            {court.occupied ? (
              <span>
                {court.players.map((player) => player.name).join(", ")}
                {court.durationLabel ? ` · ${court.durationLabel}` : ""}
              </span>
            ) : (
              <span>Free</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
