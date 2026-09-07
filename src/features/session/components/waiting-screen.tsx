import type { SessionView } from "../model/session-view";

export function WaitingScreen({
  view,
  notice,
}: {
  view: SessionView;
  notice: string | null;
}) {
  return (
    <section className="play-card">
      <p className="scoreboard-label">Waiting pool</p>
      <h1 className="play-title">In the pool</h1>
      <p className="play-lede">
        {view.waitingCount} waiting · {view.requiredPlayers} needed for{" "}
        {view.settings.gameMode}
      </p>
      {notice ? <p className="play-notice">{notice}</p> : null}

      <ul className="play-pool">
        {view.waiting.length === 0 ? (
          <li className="play-empty">Nobody is waiting yet.</li>
        ) : (
          view.waiting.map((player) => (
            <li key={player.id}>
              {player.name}
              {view.me?.id === player.id ? " (you)" : ""}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
